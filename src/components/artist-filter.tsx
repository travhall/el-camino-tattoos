import Link from "next/link";
import type { Artist } from "@/lib/content";

/**
 * Filters the portfolio by artist without leaving /portfolio: each chip is a
 * plain link to /portfolio?artist=<slug> (shareable, no client JS). scroll
 * is off so the page stays where it is while the grid below changes.
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
      href: `/portfolio?artist=${encodeURIComponent(artist.slug)}`,
      label: artist.name,
      active: artist.slug === activeSlug,
    })),
  ];

  return (
    <nav aria-label="Filter portfolio by artist">
      <ul className="filter-list">
        {items.map(({ href, label, active }) => (
          <li key={href}>
            <Link
              href={href}
              scroll={false}
              aria-current={active ? "page" : undefined}
              className="filter-chip"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
