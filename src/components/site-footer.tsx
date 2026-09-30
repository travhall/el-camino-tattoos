import { NavLink } from "@/components/nav-link";
import { navLinks } from "@/components/site-header";
import { ShopInfo } from "@/components/shop-info";
import { ButtonLink } from "@/components/ui/button";
import { getSite } from "@/lib/content";
import { siteName } from "@/lib/site";

export async function SiteFooter() {
  const site = await getSite();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <p className="site-footer__name">{siteName}</p>
          <nav aria-label="Footer" className="site-footer__nav">
            {navLinks.map(({ href, label }) => (
              <NavLink key={href} href={href} className="site-footer__nav-link">
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <ShopInfo site={site} />
        <div className="site-footer__cta">
          <ButtonLink href="/contact">Request an appointment</ButtonLink>
        </div>
      </div>
      <p className="site-footer__copyright">
        © {new Date().getFullYear()} {siteName}
      </p>
    </footer>
  );
}
