import { fontClasses } from "@/lib/fonts";

// The single root layout: document shell only. The public site (`(site)`) and
// the Keystatic admin (`keystatic`) are nested layouts, so every response,
// including 404s, gets a proper <html lang>. Global CSS is imported by the site
// layout, not here, so the admin stays visually isolated.
/**
 * Marks <html data-js> before the first paint, so scroll entrances
 * (RevealOnView) can hold their parts hidden without a flash. If no
 * RevealOnView has mounted after 4s (scripts failed), the mark comes off and
 * everything shows.
 */
const revealScript = `document.documentElement.dataset.js="";setTimeout(function(){if(!window.__revealReady)delete document.documentElement.dataset.js},4000)`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: the script below adds data-js to <html>
    // before React hydrates it.
    <html lang="en" className={fontClasses} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: revealScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
