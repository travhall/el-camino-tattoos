import { createReader } from "@keystatic/core/reader";
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

const pageEntries = {
  home: reader.singletons.pageHome,
  artists: reader.singletons.pageArtists,
  portfolio: reader.singletons.pagePortfolio,
  aftercare: reader.singletons.pageAftercare,
  faq: reader.singletons.pageFaq,
  contact: reader.singletons.pageContact,
};

export type HeroPage = keyof typeof pageEntries;

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
 * One page's hero, from that page's entry under Pages in Keystatic. Every
 * field may be empty; a button is kept only with both a label and a link,
 * and a photo only with a description (it is content, so it needs alt text).
 */
export const getHero = cache(async (page: HeroPage): Promise<HeroContent> => {
  const entry = (await pageEntries[page].read())?.hero;
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

export type HomeContent = {
  /** The strip of short lines under the filmstrip. */
  promises: readonly string[];
  /** The artists section; empty fields are hidden or fall back. */
  artists: {
    eyebrow: string;
    heading: string;
    intro: string;
    buttonLabel: string;
  };
};

/** The home page's own content besides its hero (Pages → Home in Keystatic). */
export const getHome = cache(async (): Promise<HomeContent> => {
  const entry = await reader.singletons.pageHome.read();
  return {
    promises: (entry?.promises ?? []).map((p) => p.trim()).filter(Boolean),
    artists: {
      eyebrow: entry?.artists.eyebrow.trim() ?? "",
      heading: entry?.artists.heading.trim() ?? "",
      intro: entry?.artists.intro.trim() ?? "",
      buttonLabel: entry?.artists.buttonLabel.trim() ?? "",
    },
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
  depositAmount: number | null;
  socials: SocialLink[];
};

/**
 * Shop details, gathered from the four entries under Shop in Keystatic
 * (Contact & location, Hours & booking, Social links, Search & sharing).
 * Every field may be empty.
 */
export const getSite = cache(async (): Promise<Site> => {
  const [contact, booking, socials, search] = await Promise.all([
    reader.singletons.shopContact.read(),
    reader.singletons.shopHours.read(),
    reader.singletons.shopSocials.read(),
    reader.singletons.shopSearch.read(),
  ]);
  return {
    description: search?.description ?? "",
    phone: contact?.phone ?? "",
    email: contact?.email ?? "",
    street: contact?.street ?? "",
    city: contact?.city ?? "",
    region: contact?.region ?? "",
    postalCode: contact?.postalCode ?? "",
    hours: Object.fromEntries(
      weekdays.map((day) => {
        const h = booking?.hours?.[day];
        return [day, h?.open ? dayHours(h.opens, h.closes) : null];
      }),
    ) as WeeklyHours,
    walkIns: booking?.walkIns ?? false,
    walkInNote: booking?.walkInNote ?? "",
    consultationNote: booking?.consultationNote ?? "",
    depositAmount: booking?.depositAmount ?? null,
    socials: (socials?.links ?? [])
      .map((s) => socialLink(s.platform as SocialPlatform, s.url, s.label))
      .filter((s): s is SocialLink => s !== null),
  };
});
