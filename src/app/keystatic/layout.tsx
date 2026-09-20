export const metadata = { title: "Keystatic", robots: { index: false } };

// Nested under the root layout (which provides <html> and <body>). Deliberately
// does not import the site's globals.css, so the admin UI keeps its own styles.
export default function KeystaticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
