import { ArtistCard } from "@/components/artist-card";
import { RevealOnView } from "@/components/reveal-on-view";
import type { CSSProperties } from "react";
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
      {artists.map((artist, index) => (
        // Each card opens as it scrolls into view (RevealOnView).
        <RevealOnView
          as="li"
          key={artist.slug}
          loadDelay={300}
          style={{ "--i": index % 3 } as CSSProperties}
        >
          <ArtistCard artist={artist} headingLevel={headingLevel} />
        </RevealOnView>
      ))}
    </ul>
  );
}
