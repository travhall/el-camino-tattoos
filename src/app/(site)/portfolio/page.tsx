import type { Metadata } from "next";
import { ArtistFilter } from "@/components/artist-filter";
import { PieceGrid } from "@/components/piece-grid";
import { getArtists, getPieces } from "@/lib/content";

export const metadata: Metadata = { title: "Portfolio" };

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
