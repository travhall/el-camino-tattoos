"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import { type ReactNode, ViewTransition } from "react";

/**
 * Page transitions (SiteShell wraps <main>'s content in this). Keyed by the
 * page's route segments, so going to another page swaps the old page out and
 * the new one in as an exit/enter pair, animated as "page-swap"
 * (globals.css). Anything that keeps the page (a filter's search params, the
 * piece viewer opening over it in the modal slot) is an update, which
 * default="none" leaves unanimated.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const page = useSelectedLayoutSegments().join("/");

  return (
    <ViewTransition
      key={page}
      enter="page-swap"
      exit="page-swap"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
