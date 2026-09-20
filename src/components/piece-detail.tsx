import Image from "next/image";
import Link from "next/link";
import type { Artist, Piece } from "@/lib/content";

// Keystatic dates are calendar dates ("2026-08-01"), so format them in UTC to
// keep the day from shifting with the visitor's time zone.
const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeZone: "UTC",
});

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? date : dateFormat.format(parsed);
}

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
    piece.date && ["Date", formatDate(piece.date)],
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
