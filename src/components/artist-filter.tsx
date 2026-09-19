import Link from "next/link";
import type { Artist } from "@/lib/content";

/**
 * Per-artist portfolios are real routes, so the filter is plain links:
 * fully static, shareable, and no client JS.
 */
export function ArtistFilter({
  artists,
  activeSlug,
}: {
  artists: readonly Artist[];
  activeSlug?: string;
}) {
  const items = [
    { href: "/portfolio", label: "All", active: !activeSlug },
    ...artists.map((artist) => ({
      href: `/artists/${artist.slug}/portfolio`,
      label: artist.name,
      active: artist.slug === activeSlug,
    })),
  ];

  return (
    <nav aria-label="Filter portfolio by artist">
      <ul className="flex flex-wrap gap-2">
        {items.map(({ href, label, active }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`inline-block rounded-full border border-foreground/30 px-4 py-1.5 text-sm ${
                active
                  ? "bg-foreground text-background"
                  : "hover:bg-foreground/10"
              }`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
