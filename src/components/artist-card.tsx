import Image from "next/image";
import Link from "next/link";
import type { Artist } from "@/lib/content";

/** `headingLevel` follows the page: h3 under a section's h2, h2 under the page h1. */
export function ArtistCard({
  artist,
  headingLevel = 3,
}: {
  artist: Artist;
  headingLevel?: 2 | 3;
}) {
  const Heading = `h${headingLevel}` as const;
  return (
    <Link href={`/artists/${artist.slug}`} className="artist-card">
      <div className="artist-card__media">
        {artist.photo && (
          <Image
            src={artist.photo}
            alt="" // decorative: the artist's name is the link text beside it
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="image-cover"
          />
        )}
      </div>
      <Heading className="artist-card__name">{artist.name}</Heading>
      {artist.specialties.length > 0 && (
        <p className="artist-card__meta">{artist.specialties.join(", ")}</p>
      )}
    </Link>
  );
}
