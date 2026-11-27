import Link from "next/link";
import type { CSSProperties } from "react";
import { Photo } from "@/components/photo";
import { RevealOnView } from "@/components/reveal-on-view";
import type { Artist, Piece } from "@/lib/content";

/**
 * A strip of portfolio pieces, each linking to its piece page. A three-column
 * grid on phones and tablets; from lg one row of equal frames, where the
 * hovered or focused frame widens and the rest give way (.filmstrip in
 * components.css). Pieces come from getFilmstripPieces(). The frames open
 * one after another the first time the strip is seen (RevealOnView; --i is
 * each frame's place in that order).
 */
export function Filmstrip({
  pieces,
  artists,
}: {
  pieces: readonly Piece[];
  artists: readonly Artist[];
}) {
  if (pieces.length === 0) {
    return <p className="empty-state">No work has been added yet.</p>;
  }

  const artistNames = new Map(artists.map((a) => [a.slug, a.name]));

  return (
    <RevealOnView as="ul" className="filmstrip" loadDelay={600}>
      {pieces.map((piece, index) => {
        const artistName = artistNames.get(piece.artistSlug);
        return (
          <li
            key={piece.slug}
            className="filmstrip__item"
            style={{ "--i": index } as CSSProperties}
          >
            {/* scroll={false}: opens the piece viewer over the page, so the
                page stays where it is (see PieceGrid). */}
            <Link
              href={`/portfolio/${piece.slug}`}
              scroll={false}
              className="filmstrip__frame"
            >
              <Photo
                src={piece.image}
                alt={
                  artistName ? `${piece.title} by ${artistName}` : piece.title
                }
                fill
                sizes="(min-width: 1024px) 30vw, 33vw"
                className="image-cover"
              />
            </Link>
          </li>
        );
      })}
    </RevealOnView>
  );
}
