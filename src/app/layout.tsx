import { fontClasses } from "@/lib/fonts";

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}
})();
`;

// The single root layout: document shell only. The public site (`(site)`) and
// the Keystatic admin (`keystatic`) are nested layouts, so every response,
// including 404s, gets a proper <html lang>. Global CSS is imported by the site
// layout, not here, so the admin stays visually isolated.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontClasses} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
