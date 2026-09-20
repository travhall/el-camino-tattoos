import { ButtonLink } from "@/components/ui/button";
import { siteName } from "@/lib/site";

export function NotFoundContent() {
  return (
    <div className="status-page">
      {/* Rendered here, not via `metadata`: the metadata title is replaced by
          the layout default after hydration. */}
      <title>{`Page not found | ${siteName}`}</title>
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p className="lead muted">
        That page doesn&rsquo;t exist or has moved. Try the portfolio, or head
        back home.
      </p>
      <div className="cluster">
        <ButtonLink href="/">Home</ButtonLink>
        <ButtonLink href="/portfolio" variant="secondary">
          Portfolio
        </ButtonLink>
      </div>
    </div>
  );
}
