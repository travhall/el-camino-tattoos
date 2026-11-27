import { PageTransition } from "@/components/page-transition";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/**
 * The public site's page chrome: skip link, header, main landmark, footer.
 * Shared by the site layout and the global 404, which bypasses the layout.
 *
 * Page transitions (PageTransition): going to another page fades the old
 * one out quickly and the new one up, while the header, named site-header
 * in components.css, holds still above both. The new page's own load
 * entrance (its hero) then plays as usual.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="page">
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter />
    </>
  );
}
