import Image from "next/image";
import Link from "next/link";
import type { Artist } from "@/lib/content";

export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link href={`/artists/${artist.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-foreground/5">
        {artist.photo && (
          <Image
            src={artist.photo}
            alt={`Portrait of ${artist.name}`}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover"
          />
        )}
      </div>
      <h3 className="mt-3 text-lg font-semibold group-hover:underline">
        {artist.name}
      </h3>
      {artist.specialties.length > 0 && (
        <p className="text-sm text-foreground/70">
          {artist.specialties.join(", ")}
        </p>
      )}
    </Link>
  );
}
