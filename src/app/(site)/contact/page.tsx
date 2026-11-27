import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { RequestForm } from "@/components/request-form";
import { ShopAddress, ShopHours } from "@/components/shop-info";
import { ShopNotes } from "@/components/shop-notes";
import { ShopStatus } from "@/components/shop-status";
import { getArtists, getHero, getSite } from "@/lib/content";
import { hasHours } from "@/lib/hours";
import { pageMetadata } from "@/lib/seo";
import { phoneHref, siteName } from "@/lib/site";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: `Request a tattoo appointment or ask a question at ${siteName}.`,
  path: "/contact",
});

export default async function ContactPage(props: PageProps<"/contact">) {
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

  // Open or not, the walk-in note, and one tap to call, text or get there.
  // Shown above the form below lg (the visitor downtown on a phone) and at
  // the top of the panel beside it from lg: the same card, placed twice.
  const visitNow = (placement: "quick" | "panel") => {
    // Compact beside the form on desktop; full 44px targets on touch screens.
    const size = placement === "panel" ? "sm" : "md";
    return (
      <section
        aria-labelledby={`come-in-${placement}`}
        className={`contact-now contact-now--${placement}`}
      >
        <div className="contact-now__text">
          <h2 id={`come-in-${placement}`} className="heading-4">
            Come in or call
          </h2>
          {hasHours(site.hours) && (
            <p className="contact-now__status">
              <ShopStatus
                hours={site.hours}
                walkIns={site.walkIns}
                walkInNote={site.walkInNote}
                className="shop-status"
              />
            </p>
          )}
          <ShopNotes site={site} className="contact-now__note" />
        </div>
        {(site.phone || mapsHref) && (
          <div className="contact-now__actions">
            {site.phone && (
              <>
                <a
                  href={phoneHref(site.phone)}
                  className={buttonClasses({ variant: "secondary", size })}
                >
                  Call
                </a>
                <a
                  href={phoneHref(site.phone).replace(/^tel:/, "sms:")}
                  className={buttonClasses({ variant: "secondary", size })}
                >
                  Text
                </a>
              </>
            )}
            {mapsHref && (
              <a
                href={mapsHref}
                className={buttonClasses({ variant: "secondary", size })}
                rel="noopener noreferrer"
                target="_blank"
              >
                Directions
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            )}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="contact-page">
      <div className="contact-page__hero">
        <Hero hero={hero} fallbackHeading="Contact" />
      </div>

      {visitNow("quick")}

      <div className="contact-page__form">
        <RequestForm
          artists={artists.map(({ slug, name }) => ({ slug, name }))}
          defaultArtist={defaultArtist}
          depositAmount={site.depositAmount}
        />
      </div>

      <aside aria-label="Visiting the shop" className="contact-page__aside">
        {visitNow("panel")}
        <div className="contact-card">
          <section aria-labelledby="visit" className="contact-card__block">
            <h2 id="visit" className="heading-4">
              Find us
            </h2>
            <ShopAddress site={site} />
            {site.phone && (
              <a href={phoneHref(site.phone)} className="link shop-info__link">
                {site.phone}
              </a>
            )}
          </section>
          {hasHours(site.hours) && (
            <section aria-labelledby="hours" className="contact-card__block">
              <h2 id="hours" className="heading-4">
                Hours
              </h2>
              <ShopHours site={site} />
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
