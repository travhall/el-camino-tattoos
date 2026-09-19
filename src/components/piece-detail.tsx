import Image from "next/image";
import Link from "next/link";
import type { Artist, Piece } from "@/lib/content";

/** Shared by the full piece page and the overlay that opens over the gallery. */
export function PieceDetail({
  piece,
  artist,
}: {
  piece: Piece;
  artist: Artist | null;
}) {
  const details = [
    piece.style && ["Style", piece.style],
    piece.placement && ["Placement", piece.placement],
    piece.date && ["Date", piece.date],
  ].filter((row): row is [string, string] => Boolean(row));

  return (
    <div className="piece-detail">
      <div className="piece-detail__media">
        <Image
          src={piece.image}
          alt={artist ? `${piece.title} by ${artist.name}` : piece.title}
          fill
          priority
          sizes="(min-width: 768px) 66vw, 100vw"
          className="image-contain"
        />
      </div>
      <div className="stack">
        <h1 id="piece-title">{piece.title}</h1>
        {artist && (
          <p>
            by{" "}
            <Link href={`/artists/${artist.slug}`} className="link">
              {artist.name}
            </Link>
          </p>
        )}
        {details.length > 0 && (
          <dl className="piece-detail__meta">
            {details.map(([term, value]) => (
              <div key={term} className="piece-detail__meta-row">
                <dt className="piece-detail__term">{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
