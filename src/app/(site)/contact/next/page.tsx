import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { RequestForm } from "@/components/request-form";
import { ShopAddress, ShopHours } from "@/components/shop-info";
import { ShopNotes } from "@/components/shop-notes";
import { ShopStatus } from "@/components/shop-status";
import { getArtists, getHero, getSite } from "@/lib/content";
import { hasHours } from "@/lib/hours";
import { pageMetadata } from "@/lib/seo";
import { phoneHref } from "@/lib/site";
import { buttonClasses } from "@/components/ui/button";

// PROTOTYPE of the redesigned contact page (see RequestForm). Kept out of
// search results until it replaces /contact.
export const metadata: Metadata = {
  ...pageMetadata({
    title: "Contact (draft)",
    description: "Draft of the redesigned contact page.",
    path: "/contact/next",
  }),
  robots: { index: false, follow: false },
};

export default async function ContactNextPage(
  props: PageProps<"/contact/next">,
) {
  const { artist: artistParam } = await props.searchParams;
  const [artists, site, hero] = await Promise.all([
    getArtists(),
    getSite(),
    getHero("contact"),
  ]);
  // ?artist=<slug> preselects them (for a "Request" button on an artist page).
  const defaultArtist =
    typeof artistParam === "string"
      ? artists.find((artist) => artist.slug === artistParam)?.name
      : undefined;
  const mapsHref = site.street
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [site.street, site.city, site.region, site.postalCode]
          .filter(Boolean)
          .join(", "),
      )}`
    : null;

  const directions = mapsHref && (
    <a
      href={mapsHref}
      className="link shop-info__link"
      rel="noopener noreferrer"
      target="_blank"
    >
      Get directions
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );

  return (
    <div className="stack stack--lg">
      <Hero hero={hero} fallbackHeading="Contact" />

      {/* Below lg, for the visitor downtown on a phone: open or not, and
          one tap to call, text or get there. From lg the panel beside the
          form has all of it. */}
      {(site.phone || mapsHref) && (
        <section aria-label="Call, text or visit" className="contact-quick">
          {hasHours(site.hours) && (
            <p className="small">
              <ShopStatus
                hours={site.hours}
                walkIns={site.walkIns}
                walkInNote={site.walkInNote}
                className="shop-status"
              />
            </p>
          )}
          <div className="contact-quick__actions">
            {site.phone && (
              <>
                <a
                  href={phoneHref(site.phone)}
                  className={buttonClasses({ variant: "secondary" })}
                >
                  Call
                </a>
                <a
                  href={phoneHref(site.phone).replace(/^tel:/, "sms:")}
                  className={buttonClasses({ variant: "secondary" })}
                >
                  Text
                </a>
              </>
            )}
            {mapsHref && (
              <a
                href={mapsHref}
                className={buttonClasses({ variant: "secondary" })}
                rel="noopener noreferrer"
                target="_blank"
              >
                Directions
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            )}
          </div>
        </section>
      )}

      <div className="contact-layout">
        <RequestForm
          artists={artists.map(({ slug, name }) => ({ slug, name }))}
          defaultArtist={defaultArtist}
          depositAmount={site.depositAmount}
        />

        <aside aria-label="Visiting the shop" className="contact-aside">
          <section aria-labelledby="visit" className="contact-aside__block">
            <h2 id="visit" className="heading-4">
              Visit
            </h2>
            <ShopNotes site={site} className="contact-aside__note" />
            <ShopAddress site={site} />
            {directions}
          </section>

          {hasHours(site.hours) && (
            <section aria-labelledby="hours" className="contact-aside__block">
              <h2 id="hours" className="heading-4">
                Hours
              </h2>
              <p className="small">
                <ShopStatus
                  hours={site.hours}
                  walkIns={site.walkIns}
                  walkInNote={site.walkInNote}
                  className="shop-status"
                />
              </p>
              <ShopHours site={site} />
            </section>
          )}

          {site.phone && (
            <section
              aria-labelledby="call"
              className="contact-aside__block contact-aside__block--call"
            >
              <h2 id="call" className="heading-4">
                Call or text
              </h2>
              <div className="cluster">
                <a
                  href={phoneHref(site.phone)}
                  className="link shop-info__link"
                >
                  {site.phone}
                </a>
                <a
                  href={phoneHref(site.phone).replace(/^tel:/, "sms:")}
                  className="link shop-info__link"
                >
                  Send a text
                </a>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
