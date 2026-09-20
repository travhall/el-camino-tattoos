import Script from "next/script";

/**
 * Privacy-friendly analytics (Cloudflare Web Analytics: cookieless, no consent
 * banner needed). Renders nothing until CLOUDFLARE_ANALYTICS_TOKEN is set, so
 * local dev and previews stay untracked. To switch providers, replace this
 * one component.
 */
export function Analytics() {
  const token = process.env.CLOUDFLARE_ANALYTICS_TOKEN;
  if (!token) return null;

  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="lazyOnload"
      data-cf-beacon={JSON.stringify({ token })}
    />
  );
}
