import { notFound, permanentRedirect } from "next/navigation";
import { getArtist } from "@/lib/content";

/**
 * An artist's portfolio is the main portfolio filtered to them
 * (/portfolio?artist=<slug>). This older address redirects there, so links
 * already shared keep working.
 */
export default async function ArtistPortfolioPage(
  props: PageProps<"/artists/[slug]/portfolio">,
) {
  const { slug } = await props.params;
  const artist = await getArtist(slug);
  if (!artist) notFound();
  permanentRedirect(`/portfolio?artist=${encodeURIComponent(artist.slug)}`);
}
