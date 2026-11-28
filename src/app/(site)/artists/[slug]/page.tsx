import type { Metadata } from "next";
import { Photo } from "@/components/photo";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import { notFound } from "next/navigation";
import { ArtistGrid } from "@/components/artist-grid";
import { BookingStatus } from "@/components/booking-status";
import { FeaturedWork } from "@/components/featured-work";
import { PieceGrid } from "@/components/piece-grid";
import { ButtonLink, IconButtonLink } from "@/components/ui/button";
import {
  getArtist,
  getArtists,
  getFeaturedPieces,
  getPiecesByArtist,
} from "@/lib/content";
import { pageMetadata, truncate } from "@/lib/seo";
import { siteName } from "@/lib/site";

export async function generateStaticParams() {
  const artists = await getArtists();
  return artists.map(({ slug }) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/artists/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const artist = await getArtist(slug);
  if (!artist) return { title: "Artist" };
  const styles = artist.specialties.join(", ");
  return pageMetadata({
    title: artist.name,
    description: artist.bio
      ? truncate(artist.bio)
      : `${artist.name} at ${siteName}${styles ? `. ${styles}.` : "."}`,
    path: `/artists/${artist.slug}`,
    image: artist.photo ?? undefined,
    imageAlt: `Portrait of ${artist.name}`,
  });
}

export default async function ArtistPage(props: PageProps<"/artists/[slug]">) {
  const { slug } = await props.params;
  const [artist, artists, pieces, featured] = await Promise.all([
    getArtist(slug),
    getArtists(),
    getPiecesByArtist(slug),
    getFeaturedPieces(slug),
  ]);
  if (!artist) notFound();

  const featuredSlugs = new Set(featured.map((piece) => piece.slug));
  const moreWork = pieces.filter((piece) => !featuredSlugs.has(piece.slug));
  const others = artists.filter((other) => other.slug !== artist.slug);
  // Each fact shows only when the artist filled it in.
  const facts: { term: string; detail: string }[] = [
    ...(artist.startedYear
      ? [{ term: "Tattooing since", detail: String(artist.startedYear) }]
      : []),
    ...(artist.favorites.length > 0
      ? [{ term: "Loves to tattoo", detail: artist.favorites.join(", ") }]
      : []),
    ...(artist.walkIns ? [{ term: "Walk-ins", detail: artist.walkIns }] : []),
  ];

  return (
    <div className="stack stack--xl">
      <div className="artist-profile">
        {/* Pinned while its frame scrolls away, as in the page hero. */}
        <div className="artist-profile__photo scroll-conceal">
          <div className="scroll-conceal__content">
            {artist.photo ? (
              <Photo
                src={artist.photo}
                alt={`Portrait of ${artist.name}`}
                fill
                priority
                sizes="(min-width: 768px) 42vw, 100vw"
                className="image-cover"
              />
            ) : (
              <PhotoPlaceholder />
            )}
          </div>
        </div>
        <div className="artist-profile__content">
          <div className="artist-profile__intro">
            <h1>{artist.name}</h1>
            {artist.specialties.length > 0 && (
              <p className="artist-profile__styles">
                {artist.specialties.join(", ")}
              </p>
            )}
            {artist.booking && <BookingStatus booking={artist.booking} />}
            {artist.bio && (
              <p className="measure preserve-lines">{artist.bio}</p>
            )}
            {facts.length > 0 && (
              <dl className="artist-facts">
                {facts.map(({ term, detail }) => (
                  <div key={term} className="artist-facts__item">
                    <dt className="artist-facts__term">{term}</dt>
                    <dd>{detail}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="artist-profile__actions">
              <ButtonLink
                href={`/contact?artist=${encodeURIComponent(artist.slug)}`}
              >
                Request with {artist.name}
              </ButtonLink>
              {artist.links.length > 0 && (
                <ul className="artist-profile__links">
                  {artist.links.map(({ url, label, icon }) => (
                    <li key={url}>
                      <IconButtonLink
                        href={url}
                        rel="noopener noreferrer"
                        icon={icon}
                        label={`${artist.name} on ${label}`}
                        variant="secondary"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <FeaturedWork pieces={featured} artistName={artist.name} />
        </div>
      </div>

      {/* The rest of their portfolio, all of it: no heading or "view all",
          the grid simply continues from the featured work. */}
      {moreWork.length > 0 && (
        <section aria-label={`More work by ${artist.name}`}>
          <PieceGrid pieces={moreWork} artists={artists} />
        </section>
      )}

      {others.length > 0 && (
        <section aria-labelledby="others-heading" className="stack stack--lg">
          <h2 id="others-heading">Other artists</h2>
          <ArtistGrid artists={others} headingLevel={3} landscape />
        </section>
      )}
    </div>
  );
}
