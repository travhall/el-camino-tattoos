import Image from "next/image";
import Link from "next/link";
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
      {pieces.map((piece) => {
        const artistName = artistNames.get(piece.artistSlug);
        return (
          <li key={piece.slug}>
            <Link href={`/portfolio/${piece.slug}`} className="piece-tile">
              <div className="piece-tile__media">
                <Image
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
          </li>
        );
      })}
    </ul>
  );
}
