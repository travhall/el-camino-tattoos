import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/**
 * The public site's page chrome: skip link, header, main landmark, footer.
 * Shared by the site layout and the global 404, which bypasses the layout.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="page">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
