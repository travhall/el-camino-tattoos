import type { Metadata } from "next";
import Link from "next/link";
import { ArtistGrid } from "@/components/artist-grid";
import { HeroPhoto } from "@/components/hero-photo";
import { PieceGrid } from "@/components/piece-grid";
import { ShopPromises } from "@/components/shop-promises";
import { ButtonLink } from "@/components/ui/button";
import { getArtists, getPieces, getSite } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { siteName } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { description } = await getSite();
  return pageMetadata({ path: "/", description });
}

export default async function Home() {
  const [artists, pieces, site] = await Promise.all([
    getArtists(),
    getPieces(),
    getSite(),
  ]);

  const heroPiece = pieces[0] ?? null;
  const heroArtistName = heroPiece
    ? artists.find((artist) => artist.slug === heroPiece.artistSlug)?.name
    : undefined;

  return (
    <div className="stack stack--xl">
      <div className="home-hero">
        <div className="home-hero__intro">
          <h1 className="home-hero__title">
            {(site.heroHeadline || siteName).split("\n").map((line) => (
              <span key={line} className="home-hero__title-line">
                {line}
              </span>
            ))}
          </h1>
          {site.heroDescription && (
            <p className="home-hero__description">{site.heroDescription}</p>
          )}
          <div className="cluster">
            <ButtonLink href="/contact">Book an appointment</ButtonLink>
            <ButtonLink href="/portfolio" variant="secondary">
              See our work
            </ButtonLink>
          </div>
        </div>
        <HeroPhoto
          piece={heroPiece}
          artistName={heroArtistName}
          walkIns={site.walkIns}
          caption={site.heroPhotoCaption}
        />
      </div>
      <ShopPromises promises={site.shopPromises} />

      <section aria-labelledby="artists-heading" className="stack stack--lg">
        <h2 id="artists-heading">Artists</h2>
        <ArtistGrid artists={artists} />
      </section>

      <section aria-labelledby="work-heading" className="stack stack--lg">
        <div className="section-header">
          <h2 id="work-heading">Recent work</h2>
          <Link href="/portfolio" className="link">
            View all
          </Link>
        </div>
        <PieceGrid pieces={pieces.slice(0, 8)} artists={artists} />
      </section>
    </div>
  );
}
