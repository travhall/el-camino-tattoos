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
    return <p className="text-foreground/70">No work has been added yet.</p>;
  }

  const artistNames = new Map(artists.map((a) => [a.slug, a.name]));

  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {pieces.map((piece) => {
        const artistName = artistNames.get(piece.artistSlug);
        return (
          <li key={piece.slug}>
            <Link href={`/portfolio/${piece.slug}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden bg-foreground/5">
                <Image
                  src={piece.image}
                  alt={
                    artistName ? `${piece.title} by ${artistName}` : piece.title
                  }
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
                />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
