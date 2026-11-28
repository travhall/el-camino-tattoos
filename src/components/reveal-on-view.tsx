"use client";

import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
  useEffect,
  useRef,
} from "react";

type RevealOnViewProps<T extends ElementType> = {
  /** The element to render (default div); it keeps its own layout role. */
  as?: T;
  /**
   * Milliseconds to wait when the block is already on screen at load, so it
   * follows the load entrances above it (the hero) instead of racing them.
   */
  loadDelay?: number;
} & ComponentPropsWithoutRef<T>;

/**
 * Plays a one-time entrance the first time its block scrolls into view
 * (the home filmstrip and artists section). It only sets `data-reveal` on
 * its element; the animations live in CSS (Entrances in components.css),
 * keyed to "play".
 *
 * Until then the parts are hidden from the first paint: the inline script
 * in the root layout marks <html data-js> before anything renders, so a
 * block already on screen doesn't flash in and out while scripts load.
 * Without scripts nothing is hidden. With reduced motion it plays at once,
 * which the global reduced-motion rule makes instant. Once played it stays
 * put: scrolling past again doesn't replay it.
 */
export function RevealOnView<T extends ElementType = "div">({
  as,
  loadDelay = 0,
  className,
  style,
  ...props
}: RevealOnViewProps<T>) {
  const Element: ElementType = as ?? "div";
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    (window as { __revealReady?: boolean }).__revealReady = true;

    const play = (delay: number) => {
      element.style.setProperty("--reveal-base", `${delay}ms`);
      element.dataset.reveal = "play";
    };

    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      play(0);
      return;
    }
    const { top, bottom } = element.getBoundingClientRect();
    if (top < window.innerHeight && bottom > 0) {
      play(loadDelay);
      return;
    }

    element.dataset.reveal = "pending";
    // An observer always reports once straight away. If the block is on
    // screen in that first report, it was on screen at load (the check
    // above can run before layout settles, on phones especially), so it
    // still waits for the load entrances (loadDelay) instead of racing them.
    let initial = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const atLoad = initial;
        initial = false;
        if (!entry?.isIntersecting) return;
        play(atLoad ? loadDelay : 0);
        observer.disconnect();
      },
      // Fires once the block's top passes a fifth of the way up the screen,
      // however tall the block is (a ratio threshold can't be reached by a
      // block taller than the screen).
      { rootMargin: "0px 0px -20% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [loadDelay]);

  return (
    <Element
      ref={ref}
      className={["reveal-on-view", className].filter(Boolean).join(" ")}
      style={style as CSSProperties}
      {...props}
    />
  );
}
