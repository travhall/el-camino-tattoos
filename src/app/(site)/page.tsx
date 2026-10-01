import type { Metadata } from "next";
import Link from "next/link";
import { ArtistGrid } from "@/components/artist-grid";
import { HeroPhoto } from "@/components/hero-photo";
import { PieceGrid } from "@/components/piece-grid";
import { ShopNotes } from "@/components/shop-notes";
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
          {site.heroKicker && (
            <p className="home-hero__kicker">{site.heroKicker}</p>
          )}
          <h1 className="home-hero__title">
            {(site.heroHeadline || siteName).split("\n").map((line) => (
              <span key={line} className="home-hero__title-line">
                {line}
              </span>
            ))}
          </h1>
          <svg
            className="home-hero__underline"
            viewBox="0 0 460 12"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M2 7C82 2 178 9 258 5S399 6 456 3M18 10c129-3 280 1 427-2"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          </svg>
          {site.heroDescription && (
            <p className="home-hero__description">{site.heroDescription}</p>
          )}
          <ButtonLink href="/contact" size="lg" className="home-hero__cta">
            Request an appointment
          </ButtonLink>
          <ShopNotes site={site} className="home-hero__note" />
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
