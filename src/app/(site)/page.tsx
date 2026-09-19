import Link from "next/link";
import { ArtistCard } from "@/components/artist-card";
import { PieceGrid } from "@/components/piece-grid";
import { getArtists, getPieces } from "@/lib/content";

export default async function Home() {
  const [artists, pieces] = await Promise.all([getArtists(), getPieces()]);

  return (
    <div className="space-y-16">
      <h1 className="text-4xl font-semibold tracking-tight">
        El Camino Tattoos
      </h1>

      <section aria-labelledby="artists-heading">
        <h2 id="artists-heading" className="mb-6 text-2xl font-semibold">
          Artists
        </h2>
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {artists.map((artist) => (
            <li key={artist.slug}>
              <ArtistCard artist={artist} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="work-heading">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 id="work-heading" className="text-2xl font-semibold">
            Recent work
          </h2>
          <Link href="/portfolio" className="hover:underline">
            View all
          </Link>
        </div>
        <PieceGrid pieces={pieces.slice(0, 8)} artists={artists} />
      </section>
    </div>
  );
}
