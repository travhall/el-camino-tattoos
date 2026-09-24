import { ShopInfo } from "@/components/shop-info";
import { getSite } from "@/lib/content";
import { siteName } from "@/lib/site";

export async function SiteFooter() {
  const site = await getSite();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <ShopInfo site={site} />
        <p>
          © {new Date().getFullYear()} {siteName}
        </p>
      </div>
    </footer>
  );
}
