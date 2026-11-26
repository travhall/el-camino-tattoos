import {
  PieceViewerDialog,
  type ViewerPiece,
} from "@/components/piece-viewer-dialog";
import { getArtists, getPieces } from "@/lib/content";

/**
 * A piece opened over the page (the intercepted /portfolio/[piece] route).
 * The viewer gets the whole portfolio, in portfolio order, so previous and
 * next step through it without leaving the dialog. A direct visit to the
 * same URL renders PieceDetail as a full page instead.
 */
export async function PieceLightbox({ slug }: { slug: string }) {
  const [pieces, artists] = await Promise.all([getPieces(), getArtists()]);
  const artistBySlug = new Map(artists.map((a) => [a.slug, a]));

  const items: ViewerPiece[] = pieces.map((piece) => {
    const artist = artistBySlug.get(piece.artistSlug);
    return {
      slug: piece.slug,
      title: piece.title,
      image: piece.image,
      alt: artist ? `${piece.title} by ${artist.name}` : piece.title,
      artist: artist ? { slug: artist.slug, name: artist.name } : null,
      // A caption, not a spec sheet: the date stays on the full piece page.
      details: [piece.style, piece.placement].filter(Boolean),
    };
  });

  return (
    <PieceViewerDialog
      pieces={items}
      initialIndex={Math.max(
        0,
        items.findIndex((item) => item.slug === slug),
      )}
    />
  );
}
