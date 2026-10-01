import Link from "next/link";
import { SiteLogo } from "@/components/site-logo";
import { NavLink } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui/button";
import { getSite } from "@/lib/content";

export const navLinks = [
  { href: "/artists", label: "Artists" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/aftercare", label: "Aftercare" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export async function SiteHeader() {
  const site = await getSite();
  const cityLine = [site.city, site.region].filter(Boolean).join(", ");

  return (
    <>
      {(site.walkInNote || cityLine) && (
        <div className="site-topbar">
          <div className="site-topbar__inner">
            {site.walkInNote ? (
              <Link href="/contact" className="site-topbar__walkin">
                {site.walkInNote}
              </Link>
            ) : (
              <span />
            )}
            <div className="site-topbar__right">
              {cityLine && (
                <span className="site-topbar__location">{cityLine}</span>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
      <header className="site-header">
        <div className="site-header__inner">
          <Link href="/" className="site-header__brand">
            <SiteLogo className="site-header__logo" />
            <span className="visually-hidden">El Camino Tattoos</span>
          </Link>
          <nav aria-label="Primary" className="site-nav">
            {navLinks.map(({ href, label }) => (
              <NavLink key={href} href={href} className="site-nav__link">
                {label}
              </NavLink>
            ))}
            {!(site.walkInNote || cityLine) && <ThemeToggle />}
            {/* Persistent booking slot; points at /contact until a booking flow exists. */}
            <ButtonLink href="/contact">Request</ButtonLink>
          </nav>
        </div>
      </header>
    </>
  );
}
