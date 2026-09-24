import type { Metadata } from "next";
import { ArtistFilter } from "@/components/artist-filter";
import { PieceGrid } from "@/components/piece-grid";
import { getArtists, getPieces } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { siteName } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Portfolio",
  description: `Recent tattoos from the artists at ${siteName}.`,
  path: "/portfolio",
});

export default async function PortfolioPage() {
  const [artists, pieces] = await Promise.all([getArtists(), getPieces()]);

  return (
    <div className="stack stack--lg">
      <h1>Portfolio</h1>
      <ArtistFilter artists={artists} />
      <PieceGrid pieces={pieces} artists={artists} />
    </div>
  );
}
