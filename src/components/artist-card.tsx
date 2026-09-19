import Image from "next/image";
import Link from "next/link";
import type { Artist } from "@/lib/content";

export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link href={`/artists/${artist.slug}`} className="artist-card">
      <div className="artist-card__media">
        {artist.photo && (
          <Image
            src={artist.photo}
            alt={`Portrait of ${artist.name}`}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="image-cover"
          />
        )}
      </div>
      <h3 className="artist-card__name">{artist.name}</h3>
      {artist.specialties.length > 0 && (
        <p className="artist-card__meta">{artist.specialties.join(", ")}</p>
      )}
    </Link>
  );
}
