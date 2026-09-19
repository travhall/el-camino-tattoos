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
    <div className="space-y-12">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_2fr]">
        <div className="relative aspect-[3/4] bg-foreground/5">
          {artist.photo && (
            <Image
              src={artist.photo}
              alt={`Portrait of ${artist.name}`}
              fill
              priority
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover"
            />
          )}
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight">
            {artist.name}
          </h1>
          {artist.specialties.length > 0 && (
            <p className="text-foreground/70">
              {artist.specialties.join(", ")}
            </p>
          )}
          {artist.bio && (
            <p className="max-w-prose whitespace-pre-line">{artist.bio}</p>
          )}
          {artist.instagram && (
            <p>
              <a
                href={`https://instagram.com/${artist.instagram}`}
                className="underline"
                rel="noopener noreferrer"
              >
                @{artist.instagram}
              </a>
            </p>
          )}
        </div>
      </div>

      <section aria-labelledby="portfolio-heading">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 id="portfolio-heading" className="text-2xl font-semibold">
            Portfolio
          </h2>
          <Link
            href={`/artists/${artist.slug}/portfolio`}
            className="hover:underline"
          >
            View all
          </Link>
        </div>
        <PieceGrid pieces={pieces.slice(0, 8)} artists={artists} />
      </section>
    </div>
  );
}
