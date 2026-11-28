import type { Metadata } from "next";
import { ArtistGrid } from "@/components/artist-grid";
import { NauticalStar } from "@/components/nautical-star";
import { Photo } from "@/components/photo";
import { ButtonLink } from "@/components/ui/button";
import { Hero } from "@/components/hero";
import { getArtists, getArtistsPage, getHero, getSite } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { siteName } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Artists",
  description: `The artists at ${siteName}: their styles and their portfolios.`,
  path: "/artists",
});

export default async function ArtistsPage() {
  const [artists, site, hero, page] = await Promise.all([
    getArtists(),
    getSite(),
    getHero("artists"),
    getArtistsPage(),
  ]);
  const { match, guests: guestPanel } = page;
  // Email when the shop has an address (Shop → Contact & location), else
  // the contact form.
  const guestHref = site.email
    ? `mailto:${site.email}?subject=${encodeURIComponent("Guest artist inquiry")}`
    : "/contact";
  const residents = artists.filter((artist) => artist.role !== "guest");
  const guests = artists.filter((artist) => artist.role === "guest");
  const faces = residents.filter((artist) => artist.photo).slice(0, 4);

  return (
    <div className="stack stack--xl">
      <Hero hero={hero} fallbackHeading="Artists" />

      <ArtistGrid artists={residents} headingLevel={2} />

      {guests.length > 0 && (
        <section aria-labelledby="guests-heading" className="stack stack--lg">
          <h2 id="guests-heading">Visiting artists</h2>
          <ArtistGrid artists={guests} headingLevel={3} />
        </section>
      )}

      {/* Two panels: for clients who don't know who to ask (the main
          button), and for tattooers after a guest spot (a quieter one).
          Side by side from lg. Copy from Pages → Artists in Keystatic. */}
      <div className="closing-panels">
        <section aria-labelledby="match-heading" className="closing-panel">
          {/* The crew's faces, overlapping: decorative, the cards above name them. */}
          {faces.length > 1 && (
            <div className="closing-panel__faces" aria-hidden="true">
              {faces.map((artist) => (
                <div key={artist.slug} className="closing-panel__face">
                  <Photo
                    src={artist.photo!}
                    alt=""
                    fill
                    sizes="64px"
                    className="image-cover"
                  />
                </div>
              ))}
            </div>
          )}
          <h2 id="match-heading">
            {match.heading || "Not sure who’s right for you?"}
          </h2>
          {match.intro && <p className="closing-panel__text">{match.intro}</p>}
          <div className="closing-panel__action">
            <ButtonLink href="/contact">
              {match.buttonLabel || "Request an appointment"}
            </ButtonLink>
          </div>
        </section>

        {guestPanel.heading && (
          <section
            aria-labelledby="guests-panel-heading"
            className="closing-panel closing-panel--quiet"
          >
            <NauticalStar className="closing-panel__star" />
            <h2 id="guests-panel-heading">{guestPanel.heading}</h2>
            {guestPanel.intro && (
              <p className="closing-panel__text">{guestPanel.intro}</p>
            )}
            <div className="closing-panel__action">
              <ButtonLink href={guestHref} variant="secondary">
                {guestPanel.buttonLabel || "Send your portfolio"}
              </ButtonLink>
              {/* Visible too, for anyone without a mail app set up. */}
              {site.email && (
                <p className="closing-panel__note">{site.email}</p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
