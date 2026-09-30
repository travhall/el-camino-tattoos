"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

const next: Record<Theme, Theme> = {
  dark: "light",
  light: "dark",
};

const labels: Record<Theme, string> = {
  light: "Use light theme",
  dark: "Use dark theme",
};

const icons: Record<Theme, string> = {
  light: "☀",
  dark: "☾",
};

// Lets more than one <ThemeToggle> be mounted at once (the site header's,
// plus a page-local one) without the instances disagreeing about the
// current theme: each one broadcasts on change and listens for the others.
const THEME_CHANGE_EVENT = "elcamino:theme-change";

/**
 * Toggles dark (the default) <-> light ("Paper mode"). Persists to
 * localStorage; the inline script in src/app/layout.tsx applies a stored
 * "light" choice before paint, so there is no flash. Reads the current value
 * from the DOM (set by that script) rather than localStorage directly, so it
 * starts in sync with whatever the blocking script already applied.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // One-time sync from the DOM: the inline blocking script in
    // src/app/layout.tsx already set data-theme (if any) before React
    // mounted. The server render always assumes "dark" (no document), so
    // this corrects local state to match reality post-hydration. Reading
    // document.documentElement in a lazy useState initializer instead would
    // cause a real hydration mismatch (server has no document); this effect
    // avoids that at the cost of one extra render, which is what this lint
    // rule normally guards against.
    const attr = document.documentElement.getAttribute("data-theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(attr === "light" ? "light" : "dark");

    function onThemeChange(event: Event) {
      setTheme((event as CustomEvent<Theme>).detail);
    }
    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
  }, []);

  function cycle() {
    const value = next[theme];
    setTheme(value);
    if (value === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem("theme");
    }
    window.dispatchEvent(
      new CustomEvent<Theme>(THEME_CHANGE_EVENT, { detail: value }),
    );
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={labels[theme]}
      onClick={cycle}
    >
      <span aria-hidden="true" className="theme-toggle__icon">
        {icons[theme]}
      </span>
    </button>
  );
}
