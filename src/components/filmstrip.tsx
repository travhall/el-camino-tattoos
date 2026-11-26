import Link from "next/link";
import { Photo } from "@/components/photo";
import type { Artist, Piece } from "@/lib/content";

/**
 * A strip of portfolio pieces, each linking to its piece page. A three-column
 * grid on phones and tablets; from lg one row of equal frames, where the
 * hovered or focused frame widens and the rest give way (.filmstrip in
 * components.css). Pieces come from getFilmstripPieces().
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
    <ul className="filmstrip">
      {pieces.map((piece) => {
        const artistName = artistNames.get(piece.artistSlug);
        return (
          <li key={piece.slug} className="filmstrip__item">
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
    </ul>
  );
}
