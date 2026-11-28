"use client";

import { usePathname } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

// True once hydrated (false in the server HTML), without an effect.
const noop = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

/**
 * The header's nav and actions. On desktop they sit in the header row and
 * the toggle is hidden (CSS). On phones they fold into a full-screen panel
 * over the page, opened by the Menu button; the wordmark and the button stay
 * on top of it.
 *
 * Without JavaScript the panel is simply open: it only collapses once
 * data-collapsible is set after hydration, and the toggle only shows then.
 * Closes on Escape (focus returns to the toggle), on navigation, and when a
 * link to the current page is clicked (it doesn't navigate).
 *
 * A link to another page leaves the panel open until the new page is in:
 * data-menu-nav on <html> turns that navigation's page transition off
 * (globals.css), so the swap happens unseen behind the panel, which then
 * fades out over the new page.
 */
export function HeaderMenu({ children }: { children: React.ReactNode }) {
  const ready = useHydrated();
  const [open, setOpen] = useState(false);
  // Set on first use, so the fade never runs on page load (when the panel
  // goes from its no-JS layout to closed).
  const [used, setUsed] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const id = useId();
  const pathname = usePathname();

  // Close on navigation: when the pathname changes, reset during render
  // (React's pattern for adjusting state to a prop) rather than in an
  // effect, which would render twice.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Once the panel has faded out after a navigation from it, let page
  // transitions animate again (pathname is the trigger, not a value read).
  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute("data-menu-nav")) return;
    const timer = window.setTimeout(
      () => root.removeAttribute("data-menu-nav"),
      500,
    );
    return () => window.clearTimeout(timer);
  }, [pathname]);

  // While open, the panel covers the screen (CSS), so: lock page scroll,
  // make everything outside the header row inert (the page behind and the
  // topbar the panel covers), start the panel's content below the row, and
  // close on Escape or when the screen widens to the desktop layout. All of
  // it is undone on close.
  useEffect(() => {
    if (!open) return;
    const button = toggle.current;
    const header = button?.closest("header");
    const row = button?.parentElement;
    if (!header || !row) return;

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    const inerted = [
      ...Array.from(header.parentElement?.children ?? []).filter(
        (el) => el !== header,
      ),
      ...Array.from(header.querySelectorAll(".site-topbar")),
    ].filter((el) => !el.hasAttribute("inert"));
    for (const el of inerted) el.setAttribute("inert", "");

    // Left in place on close, so the panel doesn't shift while it fades out.
    const setTop = () =>
      header.style.setProperty(
        "--menu-top",
        `${row.getBoundingClientRect().bottom}px`,
      );
    setTop();

    const desktop = window.matchMedia("(min-width: 64rem)");
    const onWide = () => desktop.matches && setOpen(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button?.focus();
    };
    desktop.addEventListener("change", onWide);
    window.addEventListener("resize", setTop);
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previousOverflow;
      for (const el of inerted) el.removeAttribute("inert");
      desktop.removeEventListener("change", onWide);
      window.removeEventListener("resize", setTop);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      {/* Two lines that turn into an X while open (see .menu-toggle). The
          label stays "Menu"; aria-expanded says whether it is open. */}
      <button
        ref={toggle}
        type="button"
        className="menu-toggle site-header__toggle"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls={id}
        hidden={!ready}
        onClick={() => {
          setUsed(true);
          setOpen((o) => !o);
        }}
      >
        <span className="menu-toggle__line" />
        <span className="menu-toggle__line" />
      </button>
      {/* Clicks bubble up from the links inside; the div itself isn't a
          control, and the links handle their own keys. */}
      <div
        id={id}
        className="site-header__menu"
        data-collapsible={ready || undefined}
        data-open={open || undefined}
        data-animate={used || undefined}
        onClick={(event) => {
          const link = (event.target as Element).closest("a");
          if (!link) return;
          // A new tab or window leaves this page as it is.
          if (event.metaKey || event.ctrlKey || event.shiftKey) return;
          const url = new URL(link.href, window.location.href);
          const closeNow =
            url.origin !== window.location.origin ||
            url.pathname === window.location.pathname;
          // Another page on this site: stay open until it's in (above).
          // Anything else (this page, a phone or social link) just closes.
          if (closeNow) setOpen(false);
          else document.documentElement.setAttribute("data-menu-nav", "");
        }}
      >
        {children}
      </div>
    </>
  );
}
