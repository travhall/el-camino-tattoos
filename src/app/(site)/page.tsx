import Link from "next/link";
import { ArtistCard } from "@/components/artist-card";
import { PieceGrid } from "@/components/piece-grid";
import { getArtists, getPieces } from "@/lib/content";

export default async function Home() {
  const [artists, pieces] = await Promise.all([getArtists(), getPieces()]);

  return (
    <div className="stack stack--xl">
      <h1 className="display">El Camino Tattoos</h1>

      <section aria-labelledby="artists-heading" className="stack stack--lg">
        <h2 id="artists-heading">Artists</h2>
        <ul className="artist-grid">
          {artists.map((artist) => (
            <li key={artist.slug}>
              <ArtistCard artist={artist} />
            </li>
          ))}
        </ul>
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
