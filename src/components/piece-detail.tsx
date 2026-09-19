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
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <div className="relative aspect-[4/5] bg-foreground/5">
        <Image
          src={piece.image}
          alt={artist ? `${piece.title} by ${artist.name}` : piece.title}
          fill
          priority
          sizes="(min-width: 768px) 66vw, 100vw"
          className="object-contain"
        />
      </div>
      <div className="space-y-4">
        <h1 id="piece-title" className="text-3xl font-semibold tracking-tight">
          {piece.title}
        </h1>
        {artist && (
          <p>
            by{" "}
            <Link href={`/artists/${artist.slug}`} className="underline">
              {artist.name}
            </Link>
          </p>
        )}
        {details.length > 0 && (
          <dl className="space-y-1 text-sm">
            {details.map(([term, value]) => (
              <div key={term} className="flex gap-2">
                <dt className="text-foreground/70">{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
