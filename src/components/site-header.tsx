import Link from "next/link";
import { NauticalStar } from "@/components/nautical-star";
import { NavLink } from "@/components/nav-link";
import { ShopStatus } from "@/components/shop-status";
import { ButtonLink, IconButtonLink } from "@/components/ui/button";
import { getSite } from "@/lib/content";
import { hasHours } from "@/lib/hours";
import { phoneHref } from "@/lib/site";

/** Site navigation, shared by the header and the footer (as in the design). */
export const navLinks = [
  { href: "/artists", label: "Artists" },
  { href: "/portfolio", label: "Portfolios" },
  { href: "/aftercare", label: "Aftercare" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * Topbar (walk-ins, location, phone) over a three-column nav row: links,
 * centred wordmark, booking and social. The topbar scrolls away and the nav
 * row stays pinned (see .site-header in components.css).
 */
export async function SiteHeader() {
  const site = await getSite();
  const cityLine = [site.city, site.region].filter(Boolean).join(", ");
  const hasStatus = Boolean(site.walkInNote) || hasHours(site.hours);
  const hasTopbar = hasStatus || Boolean(cityLine || site.phone);

  return (
    <header className="site-header">
      {hasTopbar && (
        <div className="site-topbar">
          {hasStatus ? (
            <Link href="/contact" className="site-topbar__walkin">
              <ShopStatus
                hours={site.hours}
                walkIns={site.walkIns}
                walkInNote={site.walkInNote}
                className="shop-status"
              />
            </Link>
          ) : (
            <span />
          )}
          <div className="site-topbar__right">
            {cityLine && (
              <span className="site-topbar__location">Downtown {cityLine}</span>
            )}
            {cityLine && site.phone && (
              <NauticalStar className="site-topbar__star" />
            )}
            {site.phone && (
              <a href={phoneHref(site.phone)} className="site-topbar__phone">
                {site.phone}
              </a>
            )}
          </div>
        </div>
      )}
      <div className="site-header__inner">
        <nav aria-label="Primary" className="site-nav">
          {navLinks.map(({ href, label }) => (
            <NavLink key={href} href={href} className="site-nav__link">
              {label}
            </NavLink>
          ))}
        </nav>
        <Link href="/" className="site-header__brand">
          <span className="site-header__wordmark">El Camino</span>
          <span className="site-header__tagline">Tattoo</span>
        </Link>
        <div className="site-header__actions">
          {/* Points at /contact until a booking flow exists. */}
          <ButtonLink
            href="/contact"
            variant="ghost"
            icon="arrow-up-right"
            className="site-header__cta"
          >
            Request an appointment
          </ButtonLink>
          {site.instagram && (
            <IconButtonLink
              href={`https://instagram.com/${site.instagram}`}
              rel="noopener noreferrer"
              icon="instagram"
              label="Instagram"
              variant="ghost"
            />
          )}
        </div>
      </div>
    </header>
  );
}
