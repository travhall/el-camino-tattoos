import type { Metadata } from "next";
import { ArtistFilter } from "@/components/artist-filter";
import { PieceGrid } from "@/components/piece-grid";
import { Hero } from "@/components/hero";
import { getArtists, getHero, getPieces } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { siteName } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Portfolio",
  description: `Recent tattoos from the artists at ${siteName}.`,
  path: "/portfolio",
});

export default async function PortfolioPage(props: PageProps<"/portfolio">) {
  const { artist: artistParam } = await props.searchParams;
  const [artists, pieces, hero] = await Promise.all([
    getArtists(),
    getPieces(),
    getHero("portfolio"),
  ]);

  // ?artist=<slug> filters the grid (ArtistFilter); an unknown or repeated
  // value shows everything.
  const active =
    typeof artistParam === "string"
      ? artists.find((artist) => artist.slug === artistParam)
      : undefined;

  return (
    <div className="stack stack--lg">
      <Hero hero={hero} fallbackHeading="Portfolio" />
      <ArtistFilter artists={artists} activeSlug={active?.slug} />
      <PieceGrid
        pieces={
          active
            ? pieces.filter((piece) => piece.artistSlug === active.slug)
            : pieces
        }
        artists={artists}
      />
    </div>
  );
}
