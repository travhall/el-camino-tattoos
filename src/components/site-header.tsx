import Link from "next/link";
import { SiteLogo } from "@/components/site-logo";
import { NavLink } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui/button";

export const navLinks = [
  { href: "/artists", label: "Artists" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/aftercare", label: "Aftercare" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  return (
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
          <ThemeToggle />
          {/* Persistent booking slot; points at /contact until a booking flow exists. */}
          <ButtonLink href="/contact">Request</ButtonLink>
        </nav>
      </div>
    </header>
  );
}
