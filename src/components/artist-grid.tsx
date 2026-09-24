import { ArtistCard } from "@/components/artist-card";
import type { Artist } from "@/lib/content";

export function ArtistGrid({
  artists,
  headingLevel,
}: {
  artists: readonly Artist[];
  headingLevel?: 2 | 3;
}) {
  if (artists.length === 0) {
    return <p className="empty-state">No artists have been added yet.</p>;
  }

  return (
    <ul className="artist-grid">
      {artists.map((artist) => (
        <li key={artist.slug}>
          <ArtistCard artist={artist} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
