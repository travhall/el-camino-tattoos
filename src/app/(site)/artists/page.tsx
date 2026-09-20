import type { Metadata } from "next";
import { ArtistCard } from "@/components/artist-card";
import { getArtists } from "@/lib/content";

export const metadata: Metadata = { title: "Artists" };

export default async function ArtistsPage() {
  const artists = await getArtists();

  return (
    <div className="stack stack--lg">
      <h1>Artists</h1>
      <ul className="artist-grid">
        {artists.map((artist) => (
          <li key={artist.slug}>
            <ArtistCard artist={artist} headingLevel={2} />
          </li>
        ))}
      </ul>
    </div>
  );
}
