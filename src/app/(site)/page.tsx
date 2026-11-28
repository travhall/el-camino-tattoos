import type { Metadata } from "next";
import { ArtistsTeaser } from "@/components/artists-teaser";
import { Filmstrip } from "@/components/filmstrip";
import { Hero } from "@/components/hero";
import { ShopPromises } from "@/components/shop-promises";
import { WhatToExpect } from "@/components/what-to-expect";
import {
  getArtists,
  getFilmstripPieces,
  getHero,
  getHome,
  getSite,
} from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { siteName } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { description } = await getSite();
  return pageMetadata({ path: "/", description });
}

export default async function Home() {
  const [artists, filmstrip, home, hero] = await Promise.all([
    getArtists(),
    getFilmstripPieces(),
    getHome(),
    getHero("home"),
  ]);

  return (
    <div className="stack stack--xl">
      <Hero hero={hero} fallbackHeading={siteName} size="home" />
      <Filmstrip pieces={filmstrip} artists={artists} />
      <ShopPromises promises={home.promises} />

      <ArtistsTeaser artists={artists} content={home.artists} />
      <WhatToExpect steps={home.steps} />
    </div>
  );
}
