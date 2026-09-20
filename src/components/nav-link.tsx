"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Nav link that reports where the visitor is. `aria-current="page"` on an
 * exact match, `"true"` when inside that section (e.g. /portfolio/koi under
 * Portfolio). Styling hangs off the attribute, not a class.
 */
export function NavLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const current =
    pathname === href
      ? "page"
      : pathname.startsWith(`${href}/`)
        ? "true"
        : undefined;

  return (
    <Link href={href} className={className} aria-current={current}>
      {children}
    </Link>
  );
}
