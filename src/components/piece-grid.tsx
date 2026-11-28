import Link from "next/link";
import type { CSSProperties } from "react";
import { Photo } from "@/components/photo";
import { RevealOnView } from "@/components/reveal-on-view";
import type { Artist, Piece } from "@/lib/content";

export function PieceGrid({
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
    <ul className="piece-grid">
      {pieces.map((piece, index) => {
        const artistName = artistNames.get(piece.artistSlug);
        return (
          // Each tile opens as it scrolls into view; --i staggers the tiles of
          // one row (RevealOnView, Entrances in components.css).
          <RevealOnView
            as="li"
            key={piece.slug}
            loadDelay={450}
            style={{ "--i": index % 4 } as CSSProperties}
          >
            {/* The piece page opens in the viewer dialog over this grid (an
                intercepted route). Without scroll={false}, Next scrolls to
                the top of the new segment on open, and closing (router.back)
                scrolls back, so the page jumps both ways. */}
            <Link
              href={`/portfolio/${piece.slug}`}
              scroll={false}
              className="piece-tile"
            >
              <div className="piece-tile__media">
                <Photo
                  src={piece.image}
                  alt={
                    artistName ? `${piece.title} by ${artistName}` : piece.title
                  }
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  className="image-cover piece-tile__image"
                />
              </div>
            </Link>
          </RevealOnView>
        );
      })}
    </ul>
  );
}
