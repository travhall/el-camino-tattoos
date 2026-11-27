import type { Metadata } from "next";
import { ArtistsTeaser } from "@/components/artists-teaser";
import { Filmstrip } from "@/components/filmstrip";
import { Hero } from "@/components/hero";
import { ShopPromises } from "@/components/shop-promises";
import {
  getArtists,
  getFilmstripPieces,
  getHero,
  getSite,
} from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { siteName } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { description } = await getSite();
  return pageMetadata({ path: "/", description });
}

export default async function Home() {
  const [artists, filmstrip, site, hero] = await Promise.all([
    getArtists(),
    getFilmstripPieces(),
    getSite(),
    getHero("home"),
  ]);

  return (
    <div className="stack stack--xl">
      <Hero hero={hero} fallbackHeading={siteName} size="home" />
      <Filmstrip pieces={filmstrip} artists={artists} />
      <ShopPromises promises={site.shopPromises} />

      <ArtistsTeaser artists={artists} />
    </div>
  );
}
