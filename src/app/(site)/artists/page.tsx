import type { Metadata } from "next";
import { ArtistCard } from "@/components/artist-card";
import { getArtists } from "@/lib/content";

export const metadata: Metadata = { title: "Artists" };

export default async function ArtistsPage() {
  const artists = await getArtists();

  return (
    <>
      <h1 className="mb-8 text-4xl font-semibold tracking-tight">Artists</h1>
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {artists.map((artist) => (
          <li key={artist.slug}>
            <ArtistCard artist={artist} />
          </li>
        ))}
      </ul>
    </>
  );
}
