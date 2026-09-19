import { createReader } from "@keystatic/core/reader";
import { cache } from "react";
import config from "../../keystatic.config";

const reader = createReader(process.cwd(), config);

export type Artist = {
  slug: string;
  name: string;
  photo: string | null;
  specialties: readonly string[];
  bio: string;
  instagram: string;
  order: number;
};

export type Piece = {
  slug: string;
  title: string;
  artistSlug: string;
  image: string;
  featured: boolean;
  style: string;
  placement: string;
  date: string | null;
};

export const getArtists = cache(async (): Promise<Artist[]> => {
  const entries = await reader.collections.artists.all();
  return entries
    .map(({ slug, entry }) => ({
      slug,
      name: entry.name,
      photo: entry.photo,
      specialties: entry.specialties,
      bio: entry.bio,
      instagram: entry.instagram,
      order: entry.order ?? 100,
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

export const getPiecesByArtist = cache(async (artistSlug: string) => {
  const pieces = await getPieces();
  return pieces.filter((piece) => piece.artistSlug === artistSlug);
});

export const getPiece = cache(async (slug: string) => {
  const pieces = await getPieces();
  return pieces.find((piece) => piece.slug === slug) ?? null;
});
