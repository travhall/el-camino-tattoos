import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

const links = [
  { href: "/artists", label: "Artists" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/aftercare", label: "Aftercare" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand">
          El Camino Tattoos
        </Link>
        <nav aria-label="Primary" className="site-nav">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className="site-nav__link">
              {label}
            </Link>
          ))}
          {/* Persistent booking slot; points at /contact until a booking flow exists. */}
          <Link href="/contact" className={buttonClasses()}>
            Book
          </Link>
        </nav>
      </div>
    </header>
  );
}
