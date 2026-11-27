import { Photo } from "@/components/photo";
import { RevealOnView } from "@/components/reveal-on-view";
import { ButtonLink } from "@/components/ui/button";
import type { Artist, HomeContent } from "@/lib/content";

/**
 * The home page's artists section (design: Figma, Ideation page,
 * "Artists"): a collage of up to three artist photos beside an eyebrow,
 * heading, intro and a link to /artists. The photos come from the first
 * three artists (by order) that have one, placed top right, left, then the
 * wide one bottom right. The copy is edited under Pages → Home → Artists
 * section in Keystatic; an empty eyebrow or intro is hidden, and an empty
 * heading or button label falls back. The first time the section scrolls
 * into view the photos open one after another and the copy follows
 * (RevealOnView). Styles are .artists-teaser in components.css.
 */
export function ArtistsTeaser({
  artists,
  content,
}: {
  artists: readonly Artist[];
  content: HomeContent["artists"];
}) {
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
        {content.eyebrow && <p className="eyebrow">{content.eyebrow}</p>}
        <h2 id="artists-heading" className="heading-1">
          {content.heading || "Our artists"}
        </h2>
        <div className="artists-teaser__body">
          {content.intro && (
            <p className="artists-teaser__intro">{content.intro}</p>
          )}
          <ButtonLink href="/artists" variant="secondary">
            {content.buttonLabel || "Meet the team"}
          </ButtonLink>
        </div>
      </div>
    </RevealOnView>
  );
}
