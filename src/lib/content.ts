import { createReader } from "@keystatic/core/reader";
import type { Node } from "@markdoc/markdoc";
import { cache } from "react";
import config from "../../keystatic.config";
import { dayHours, type WeeklyHours, weekdays } from "./hours";
import { type SocialLink, type SocialPlatform, socialLink } from "./socials";

const reader = createReader(process.cwd(), config);

export type Artist = {
  slug: string;
  name: string;
  photo: string | null;
  specialties: readonly string[];
  bio: string;
  instagram: string;
  order: number;
  role: "resident" | "apprentice" | "guest";
  visitDates: string;
};

export type Piece = {
  slug: string;
  title: string;
  artistSlug: string;
  image: string;
  featured: boolean;
  /** Ticked for the homepage filmstrip (see getFilmstripPieces). */
  filmstrip: boolean;
  style: string;
  placement: string;
  date: string | null;
};

/**
 * Accepts what an editor might paste ("name", "@name", or a profile URL) and
 * returns a bare handle, or "" when it isn't a valid Instagram username.
 */
export function normalizeInstagramHandle(raw: string): string {
  const handle = raw
    .trim()
    .replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? handle : "";
}

export const getArtists = cache(async (): Promise<Artist[]> => {
  const entries = await reader.collections.artists.all();
  return entries
    .map(({ slug, entry }) => ({
      slug,
      name: entry.name,
      photo: entry.photo,
      specialties: entry.specialties,
      bio: entry.bio,
      instagram: normalizeInstagramHandle(entry.instagram),
      order: entry.order ?? 100,
      role: entry.role ?? "resident",
      visitDates: entry.visitDates,
    }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
});

export const getArtist = cache(async (slug: string) => {
  const artists = await getArtists();
  return artists.find((artist) => artist.slug === slug) ?? null;
});

/** Featured pieces first, then newest. Pieces missing an artist or image are skipped. */
export const getPieces = cache(async (): Promise<Piece[]> => {
  const entries = await reader.collections.pieces.all();
  return entries
    .flatMap(({ slug, entry }) =>
      entry.artist && entry.image
        ? [
            {
              slug,
              title: entry.title,
              artistSlug: entry.artist,
              image: entry.image,
              featured: entry.featured,
              filmstrip: entry.filmstrip,
              style: entry.style,
              placement: entry.placement,
              date: entry.date,
            },
          ]
        : [],
    )
    .sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        (b.date ?? "").localeCompare(a.date ?? ""),
    );
});

/**
 * Pieces for the homepage filmstrip: the ticked ones in portfolio order, or
 * the first pieces when none are ticked, so the strip is never empty while
 * there is work.
 */
export const getFilmstripPieces = cache(async (limit = 9) => {
  const pieces = await getPieces();
  const ticked = pieces.filter((piece) => piece.filmstrip);
  return (ticked.length > 0 ? ticked : pieces).slice(0, limit);
});

export const getPiecesByArtist = cache(async (artistSlug: string) => {
  const pieces = await getPieces();
  return pieces.filter((piece) => piece.artistSlug === artistSlug);
});

export const getPiece = cache(async (slug: string) => {
  const pieces = await getPieces();
  return pieces.find((piece) => piece.slug === slug) ?? null;
});

const hasContent = (node: Node) => node.children.length > 0;

export type AftercareStep = { title: string; body: string };

export type Aftercare = {
  intro: string;
  steps: readonly AftercareStep[];
  warning: Node;
} | null;

/** The Aftercare page's structured content, or null until someone has written it. */
export const getAftercare = cache(async (): Promise<Aftercare> => {
  const entry = await reader.singletons.aftercare.read();
  if (!entry) return null;
  const { node } = await entry.warning();
  const steps = entry.steps.filter((step) => step.title && step.body);
  const hasIntro = Boolean(entry.intro);
  const hasWarning = hasContent(node);
  if (!hasIntro && steps.length === 0 && !hasWarning) return null;
  return { intro: entry.intro ?? "", steps, warning: node };
});

export type Faq = {
  slug: string;
  question: string;
  order: number;
  answer: Node;
};

/** FAQ entries in order. An entry with no question or no answer is skipped. */
export const getFaqs = cache(async (): Promise<Faq[]> => {
  const entries = await reader.collections.faq.all();
  const faqs = await Promise.all(
    entries.map(async ({ slug, entry }) => ({
      slug,
      question: entry.question.trim(),
      order: entry.order ?? 100,
      answer: (await entry.answer()).node,
    })),
  );
  return faqs
    .filter((faq) => faq.question && hasContent(faq.answer))
    .sort((a, b) => a.order - b.order || a.question.localeCompare(b.question));
});

export type HeroPage =
  "home" | "artists" | "portfolio" | "aftercare" | "faq" | "contact";

export type HeroButton = { label: string; href: string };

export type HeroContent = {
  eyebrow: string;
  heading: string;
  intro: string;
  buttons: readonly HeroButton[];
  /** null when the page has no photo, or the photo has no description. */
  image: { src: string; alt: string; position: "left" | "right" } | null;
};

/**
 * One page's hero from the Keystatic "Page heroes" entry. Every field may be
 * empty; a button is kept only with both a label and a link, and a photo
 * only with a description (it is content, so it needs alt text).
 */
export const getHero = cache(async (page: HeroPage): Promise<HeroContent> => {
  const entry = (await reader.singletons.heroes.read())?.[page];
  const buttons = [entry?.primary, entry?.secondary].flatMap((button) =>
    button?.label.trim() && button.href.trim()
      ? [{ label: button.label.trim(), href: button.href.trim() }]
      : [],
  );
  const alt = entry?.imageAlt.trim() ?? "";
  return {
    eyebrow: entry?.eyebrow.trim() ?? "",
    heading: entry?.heading.trim() ?? "",
    intro: entry?.intro.trim() ?? "",
    buttons,
    image:
      entry?.image && alt
        ? {
            src: entry.image,
            alt,
            position: entry.imagePosition === "left" ? "left" : "right",
          }
        : null,
  };
});

export type Site = {
  description: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  hours: WeeklyHours;
  walkIns: boolean;
  walkInNote: string;
  consultationNote: string;
  shopPromises: readonly string[];
  footerTagline: string;
  footerSignoff: string;
  depositAmount: number | null;
  socials: SocialLink[];
};

/** Shop details from the Keystatic "Shop info" entry. Every field may be empty. */
export const getSite = cache(async (): Promise<Site> => {
  const entry = await reader.singletons.site.read();
  return {
    description: entry?.description ?? "",
    phone: entry?.phone ?? "",
    email: entry?.email ?? "",
    street: entry?.street ?? "",
    city: entry?.city ?? "",
    region: entry?.region ?? "",
    postalCode: entry?.postalCode ?? "",
    hours: Object.fromEntries(
      weekdays.map((day) => {
        const h = entry?.hours?.[day];
        return [day, h?.open ? dayHours(h.opens, h.closes) : null];
      }),
    ) as WeeklyHours,
    walkIns: entry?.walkIns ?? false,
    walkInNote: entry?.walkInNote ?? "",
    consultationNote: entry?.consultationNote ?? "",
    shopPromises: entry?.shopPromises ?? [],
    footerTagline: entry?.footerTagline ?? "",
    footerSignoff: entry?.footerSignoff ?? "",
    depositAmount: entry?.depositAmount ?? null,
    socials: (entry?.socials ?? [])
      .map((s) => socialLink(s.platform as SocialPlatform, s.url, s.label))
      .filter((s): s is SocialLink => s !== null),
  };
});
