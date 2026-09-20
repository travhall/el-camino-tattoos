"use client";

import { useEffect, useRef } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { siteName } from "@/lib/site";

export type ErrorContentProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * Shared by the site error boundary and the global one. Focus moves to the
 * heading on mount so keyboard and screen-reader users land on the message
 * instead of a blank page.
 */
export function ErrorContent({ error, retry }: ErrorContentProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="status-page">
      <title>{`Something went wrong | ${siteName}`}</title>
      <p className="eyebrow">Error</p>
      <h1 ref={headingRef} tabIndex={-1}>
        Something went wrong
      </h1>
      <p className="lead muted">
        We couldn&rsquo;t load this page. Try again, or head back home.
      </p>
      <div className="cluster">
        <Button onClick={() => retry()}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Home
        </ButtonLink>
      </div>
      {error.digest && <p className="caption">Reference: {error.digest}</p>}
    </div>
  );
}
