import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArtistFilter } from "@/components/artist-filter";
import { PieceGrid } from "@/components/piece-grid";
import { getArtist, getArtists, getPiecesByArtist } from "@/lib/content";

export async function generateStaticParams() {
  const artists = await getArtists();
  return artists.map(({ slug }) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/artists/[slug]/portfolio">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const artist = await getArtist(slug);
  return { title: artist ? `${artist.name} — Portfolio` : "Portfolio" };
}

export default async function ArtistPortfolioPage(
  props: PageProps<"/artists/[slug]/portfolio">,
) {
  const { slug } = await props.params;
  const [artist, artists, pieces] = await Promise.all([
    getArtist(slug),
    getArtists(),
    getPiecesByArtist(slug),
  ]);
  if (!artist) notFound();

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-semibold tracking-tight">Portfolio</h1>
      <ArtistFilter artists={artists} activeSlug={artist.slug} />
      <PieceGrid pieces={pieces} artists={artists} />
    </div>
  );
}
