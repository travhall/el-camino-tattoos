import type { Metadata } from "next";
import { siteName } from "@/lib/site";

/** One line of plain text, cut to a length search results will show. */
export function truncate(text: string, max = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Per-page metadata. A page-level `openGraph` replaces the layout's whole
 * object rather than merging into it, so every page builds its own here and
 * keeps siteName, type and locale. Relative `path` and `image` resolve against
 * `metadataBase`. With no `title`, the layout's default (the site name) is used.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
}: {
  title?: string;
  description?: string;
  path: string;
  image?: string;
  imageAlt?: string;
}): Metadata {
  const shared = {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
  };
  return {
    ...shared,
    alternates: { canonical: path },
    openGraph: {
      ...shared,
      title: title ?? siteName,
      url: path,
      siteName,
      type: "website",
      locale: "en_US",
      ...(image ? { images: [{ url: image, alt: imageAlt ?? title }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: title ?? siteName,
      ...(description ? { description } : {}),
      ...(image ? { images: [image] } : {}),
    },
  };
}
