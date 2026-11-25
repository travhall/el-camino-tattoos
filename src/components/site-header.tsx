import Link from "next/link";
import { NauticalStar } from "@/components/nautical-star";
import { NavLink } from "@/components/nav-link";
import { ButtonLink } from "@/components/ui/button";
import { getSite } from "@/lib/content";
import { phoneHref } from "@/lib/site";

/** Footer navigation. The header has its own list (see headerLinks). */
export const navLinks = [
  { href: "/artists", label: "Artists" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/aftercare", label: "Aftercare" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

// The header drops Contact (the Request button is the way in) and calls the
// portfolio "Our Work", as in the design.
const headerLinks = [
  { href: "/", label: "Home" },
  { href: "/artists", label: "Artists" },
  { href: "/portfolio", label: "Our Work" },
  { href: "/faq", label: "FAQ" },
  { href: "/aftercare", label: "Aftercare" },
] as const;

export async function SiteHeader() {
  const site = await getSite();
  const cityLine = [site.city, site.region].filter(Boolean).join(", ");
  const hasTopbar = Boolean(site.walkInNote || cityLine || site.phone);

  return (
    <header className="site-header">
      {hasTopbar && (
        <div className="site-topbar">
          <div className="site-topbar__inner">
            {site.walkInNote ? (
              <Link href="/contact" className="site-topbar__walkin">
                <span aria-hidden="true" className="site-topbar__dot" />
                <span className="site-topbar__walkin-text">
                  {site.walkInNote}
                </span>
              </Link>
            ) : (
              <span />
            )}
            <div className="site-topbar__right">
              {cityLine && (
                <span className="site-topbar__location">{cityLine}</span>
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
        </div>
      )}
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand">
          <span className="site-header__wordmark">El Camino</span>
          <span className="site-header__tagline">Tattoo</span>
        </Link>
        <nav aria-label="Primary" className="site-nav">
          {headerLinks.map(({ href, label }) => (
            <NavLink key={href} href={href} className="site-nav__link">
              {label}
            </NavLink>
          ))}
        </nav>
        {/* Persistent booking slot; points at /contact until a booking flow exists. */}
        <ButtonLink
          href="/contact"
          variant="secondary"
          icon="arrow-up-right"
          className="site-header__cta"
        >
          Request an appointment
        </ButtonLink>
      </div>
    </header>
  );
}
