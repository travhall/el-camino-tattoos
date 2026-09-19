import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PieceGrid } from "@/components/piece-grid";
import { getArtist, getArtists, getPiecesByArtist } from "@/lib/content";

export async function generateStaticParams() {
  const artists = await getArtists();
  return artists.map(({ slug }) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/artists/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const artist = await getArtist(slug);
  return { title: artist?.name ?? "Artist" };
}

export default async function ArtistPage(props: PageProps<"/artists/[slug]">) {
  const { slug } = await props.params;
  const [artist, artists, pieces] = await Promise.all([
    getArtist(slug),
    getArtists(),
    getPiecesByArtist(slug),
  ]);
  if (!artist) notFound();

  return (
    <div className="stack stack--xl">
      <div className="artist-profile">
        <div className="artist-profile__photo">
          {artist.photo && (
            <Image
              src={artist.photo}
              alt={`Portrait of ${artist.name}`}
              fill
              priority
              sizes="(min-width: 768px) 33vw, 100vw"
              className="image-cover"
            />
          )}
        </div>
        <div className="stack">
          <h1>{artist.name}</h1>
          {artist.specialties.length > 0 && (
            <p className="muted">{artist.specialties.join(", ")}</p>
          )}
          {artist.bio && <p className="measure preserve-lines">{artist.bio}</p>}
          {artist.instagram && (
            <p>
              <a
                href={`https://instagram.com/${artist.instagram}`}
                className="link"
                rel="noopener noreferrer"
              >
                @{artist.instagram}
              </a>
            </p>
          )}
        </div>
      </div>

      <section aria-labelledby="portfolio-heading" className="stack stack--lg">
        <div className="section-header">
          <h2 id="portfolio-heading">Portfolio</h2>
          <Link href={`/artists/${artist.slug}/portfolio`} className="link">
            View all
          </Link>
        </div>
        <PieceGrid pieces={pieces.slice(0, 8)} artists={artists} />
      </section>
    </div>
  );
}
