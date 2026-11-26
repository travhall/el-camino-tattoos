import { NavLink } from "@/components/nav-link";
import { ShopAddress } from "@/components/shop-info";
import { ShopStatus } from "@/components/shop-status";
import { navLinks } from "@/components/site-header";
import { getSite } from "@/lib/content";
import { phoneHref, siteName } from "@/lib/site";

/**
 * Rounded footer band: contact, walk-in status and nav over an oversized
 * wordmark. On desktop it reveals on scroll: the band's top edge rises while
 * its content stays pinned to the bottom of the viewport (.scroll-reveal in
 * components.css). CSS only, so it stays a plain block where scroll-driven
 * animation isn't supported or motion is reduced.
 */
export async function SiteFooter() {
  const site = await getSite();

  return (
    <footer className="site-footer scroll-reveal">
      <div className="site-footer__inner scroll-reveal__content">
        <div className="site-footer__top">
          <div className="site-footer__contact">
            <ShopAddress site={site} />
            {site.phone && (
              <a href={phoneHref(site.phone)} className="site-footer__link">
                {site.phone}
              </a>
            )}
          </div>
          <p className="site-footer__status">
            <ShopStatus
              hours={site.hours}
              walkIns={site.walkIns}
              walkInNote={site.walkInNote}
              className="shop-status"
            />
          </p>
          <nav aria-label="Footer" className="site-footer__nav">
            {navLinks.map(({ href, label }) => (
              <NavLink key={href} href={href} className="site-footer__link">
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        {/* Decorative: the copyright line below carries the name. The text
            is drawn from data-text by CSS, so it is neither read out nor
            measured for contrast; it is a faint backdrop, not text to read. */}
        <span
          aria-hidden="true"
          data-text="El Camino Tattoo"
          className="site-footer__wordmark"
        />
        <p className="site-footer__copyright">
          © {new Date().getFullYear()} {siteName}
        </p>
      </div>
    </footer>
  );
}
