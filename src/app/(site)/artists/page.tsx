import type { Metadata } from "next";
import { ArtistGrid } from "@/components/artist-grid";
import { getArtists } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { siteName } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Artists",
  description: `The artists at ${siteName}: their styles and their portfolios.`,
  path: "/artists",
});

export default async function ArtistsPage() {
  const artists = await getArtists();

  return (
    <div className="stack stack--lg">
      <h1>Artists</h1>
      <ArtistGrid artists={artists} headingLevel={2} />
    </div>
  );
}
