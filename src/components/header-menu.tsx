"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

/**
 * The header's nav and actions. On desktop they sit in the header row and
 * the toggle is hidden (CSS). On phones they fold into a full-screen panel
 * over the page, opened by the Menu button; the wordmark and the button stay
 * on top of it.
 *
 * Without JavaScript the panel is simply open: it only collapses once
 * data-collapsible is set after hydration, and the toggle only shows then.
 * Closes on Escape (focus returns to the toggle), on navigation, and when a
 * link inside is clicked (a link to the current page doesn't navigate).
 */
export function HeaderMenu({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  // Set on first use, so the fade never runs on page load (when the panel
  // goes from its no-JS layout to closed).
  const [used, setUsed] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const id = useId();
  const pathname = usePathname();

  useEffect(() => setReady(true), []);
  // Close on navigation (pathname is the trigger, not a value read).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setOpen(false), [pathname]);

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
          if ((event.target as Element).closest("a")) setOpen(false);
        }}
      >
        {children}
      </div>
    </>
  );
}
