import Link from "next/link";
import { PieceViewerDialog } from "@/components/piece-viewer-dialog";
import { Photo } from "@/components/photo";
import type { Artist, Piece } from "@/lib/content";

/**
 * A piece opened over the page (the intercepted /portfolio/[piece] route):
 * the photo as large as the screen allows, with the title, artist and
 * details as a caption in a sheet underneath. A direct visit to the same URL
 * renders PieceDetail as a full page instead.
 */
export function PieceLightbox({
  piece,
  artist,
}: {
  piece: Piece;
  artist: Artist | null;
}) {
  // A caption, not a spec sheet: the date stays on the full piece page.
  const details = [piece.style, piece.placement].filter(Boolean);

  return (
    <PieceViewerDialog
      media={
        <Photo
          src={piece.image}
          alt={artist ? `${piece.title} by ${artist.name}` : piece.title}
          fill
          priority
          sizes="100vw"
          className="image-contain"
        />
      }
      caption={
        <>
          <h1 id="piece-title" className="viewer__title">
            {piece.title}
          </h1>
          <p className="viewer__details">
            {artist && (
              <span className="viewer__detail">
                by{" "}
                <Link href={`/artists/${artist.slug}`} className="link">
                  {artist.name}
                </Link>
              </span>
            )}
            {details.map((detail) => (
              <span key={detail} className="viewer__detail">
                {detail}
              </span>
            ))}
          </p>
        </>
      }
    />
  );
}
