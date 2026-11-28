import { ArtistCard } from "@/components/artist-card";
import { RevealOnView } from "@/components/reveal-on-view";
import type { CSSProperties } from "react";
import type { Artist } from "@/lib/content";

/** `landscape` crops the portraits wide (4:3), for a secondary row such as
 * Other artists on a profile, so it doesn't compete with the profile photo. */
export function ArtistGrid({
  artists,
  headingLevel,
  landscape = false,
}: {
  artists: readonly Artist[];
  headingLevel?: 2 | 3;
  landscape?: boolean;
}) {
  if (artists.length === 0) {
    return <p className="empty-state">No artists have been added yet.</p>;
  }

  return (
    <ul
      className={
        landscape ? "artist-grid artist-grid--landscape" : "artist-grid"
      }
    >
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
