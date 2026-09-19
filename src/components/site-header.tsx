import Link from "next/link";

const links = [
  { href: "/artists", label: "Artists" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/aftercare", label: "Aftercare" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-foreground/15">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          El Camino Tattoos
        </Link>
        <nav
          aria-label="Primary"
          className="flex flex-wrap items-center gap-x-5 gap-y-2"
        >
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className="hover:underline">
              {label}
            </Link>
          ))}
          {/* Persistent booking slot; points at /contact until a booking flow exists. */}
          <Link
            href="/contact"
            className="rounded-full bg-foreground px-4 py-1.5 text-background"
          >
            Book
          </Link>
        </nav>
      </div>
    </header>
  );
}
