import { NavLink } from "@/components/nav-link";
import { navLinks } from "@/components/site-header";
import { ShopAddress, ShopContact, ShopHours } from "@/components/shop-info";
import { ButtonLink } from "@/components/ui/button";
import { getSite } from "@/lib/content";
import { siteName } from "@/lib/site";

export async function SiteFooter() {
  const site = await getSite();

  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <p className="site-footer__name">{siteName}</p>
      </div>
      <div className="site-footer__grid">
        <div className="site-footer__col">
          <h2 className="eyebrow">Find the shop</h2>
          <ShopAddress site={site} />
        </div>
        <div className="site-footer__col">
          <h2 className="eyebrow">Come on by</h2>
          <ShopHours site={site} />
          {site.walkInNote && (
            <p className="site-footer__note">{site.walkInNote}</p>
          )}
        </div>
        <div className="site-footer__col">
          <h2 className="eyebrow">Get in touch</h2>
          <ShopContact site={site} />
          <ButtonLink href="/contact" className="site-footer__cta">
            Request an appointment
          </ButtonLink>
        </div>
        <nav aria-label="Footer" className="site-footer__col">
          <h2 className="eyebrow">Take a look around</h2>
          <div className="site-footer__nav">
            {navLinks.map(({ href, label }) => (
              <NavLink key={href} href={href} className="site-footer__nav-link">
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
      <p className="site-footer__copyright">
        © {new Date().getFullYear()} {siteName}
      </p>
    </footer>
  );
}
