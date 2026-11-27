import { Photo } from "@/components/photo";
import { RevealOnView } from "@/components/reveal-on-view";
import { ButtonLink } from "@/components/ui/button";
import type { Artist } from "@/lib/content";

/**
 * The home page's artists section (design: Figma, Ideation page,
 * "Artists"): a collage of up to three artist photos beside an eyebrow,
 * heading, intro and a link to /artists. The photos come from the first
 * three artists (by order) that have one, placed top right, left, then the
 * wide one bottom right. The first time the section scrolls into view the
 * photos open one after another and the copy follows (RevealOnView). Styles are .artists-teaser in
 * components.css.
 */
export function ArtistsTeaser({ artists }: { artists: readonly Artist[] }) {
  const photos = artists.flatMap((artist) =>
    artist.photo ? [{ ...artist, photo: artist.photo }] : [],
  );

  return (
    <RevealOnView
      as="section"
      aria-labelledby="artists-heading"
      className="artists-teaser"
    >
      {photos.length > 0 && (
        <div className="artists-teaser__collage">
          {photos.slice(0, 3).map((artist) => (
            <div key={artist.slug} className="artists-teaser__photo">
              <Photo
                src={artist.photo}
                alt={artist.name}
                fill
                sizes="(min-width: 1024px) 360px, 60vw"
                className="image-cover"
              />
            </div>
          ))}
        </div>
      )}
      <div className="artists-teaser__content">
        <p className="eyebrow">Our people make the difference</p>
        <h2 id="artists-heading" className="heading-1">
          The Artists of El Camino
        </h2>
        <div className="artists-teaser__body">
          <p className="artists-teaser__intro">
            We’re all local, working-class people, and we’re guessing you are
            too. If not, no worries, all are welcome here.
          </p>
          <ButtonLink href="/artists" variant="secondary">
            Meet the team
          </ButtonLink>
        </div>
      </div>
    </RevealOnView>
  );
}
