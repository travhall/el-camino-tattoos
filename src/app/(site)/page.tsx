import type { Metadata } from "next";
import Link from "next/link";
import { ArtistGrid } from "@/components/artist-grid";
import { PieceGrid } from "@/components/piece-grid";
import { ShopNotes } from "@/components/shop-notes";
import { getArtists, getPieces, getSite } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

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

  return (
    <div className="stack stack--xl">
      <div className="stack">
        <h1 className="display">El Camino Tattoos</h1>
        <ShopNotes site={site} />
      </div>

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
