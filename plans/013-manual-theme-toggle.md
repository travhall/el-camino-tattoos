# Plan 013: Add a manual light/dark theme toggle

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat bea6c5a..HEAD -- src/styles/roles.css src/styles/theme.css src/app/layout.tsx src/components/site-header.tsx tests/interactions.spec.ts`
> If any changed since this plan was written, compare the "Current state"
> excerpts below against the live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW-MED (new client component, new inline script in the root
  layout, and a CSS structure change to `roles.css` — none of it touches
  existing role _values_, only adds a new trigger for the dark set that
  already exists)
- **Depends on**: none
- **Category**: dx / feature
- **Planned at**: commit `bea6c5a`, 2026-09-29

## Why this matters

The site currently has no way for a visitor to pick light or dark
independent of their OS setting — `color-scheme: light dark;`
(`src/styles/theme.css:9-11`) and `@media (prefers-color-scheme: dark)`
(`src/styles/roles.css:129`) are the only mechanism. That's a reasonable
default, but plenty of visitors want to override their OS-wide setting for
one site (e.g. OS set to dark globally, but this specific portfolio site
reads better in light, or vice versa), and a small visible control is a
common, low-cost affordance. This plan adds a `data-theme` attribute-driven
override on top of the existing system — the OS-preference behavior is
unchanged for anyone who never touches the toggle.

## Current state

- `src/styles/theme.css:9-11`:
  ```css
  :root {
    color-scheme: light dark;
  }
  ```
- `src/styles/roles.css:70` (`:root { ... }`, light values) and line 129
  (`@media (prefers-color-scheme: dark) { :root { ... } }`, ~30 dark
  overrides) — see the full current file for the complete list of role
  variables; this plan does not change any of their values, only adds a
  second way to trigger the dark set.
- `src/app/layout.tsx` (root layout, full file today):
  ```tsx
  import { fontClasses } from "@/lib/fonts";

  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <html lang="en" className={fontClasses}>
        <body>{children}</body>
      </html>
    );
  }
  ```
  This is a Server Component today (no `"use client"`, no interactivity) and
  must stay one — the inline script this plan adds is a plain `<script>`
  tag, not a React event handler, so the component does not need to become a
  Client Component.
- `src/components/site-header.tsx` — Server Component today, renders
  `<header className="site-header">` with the nav links and a `Request`
  button. The toggle button goes here, as a small Client Component child
  (matching the existing pattern: `src/components/nav-link.tsx` is a small
  `"use client"` component embedded in the otherwise-server `SiteHeader`).
- No `data-theme` attribute exists anywhere in `src/` today (`grep -rn
"data-theme" src/` returns nothing) — this plan introduces it from scratch.
- Repo convention for small interactive client components: `src/components/nav-link.tsx`
  (full file):
  ```tsx
  "use client";

  import Link from "next/link";
  import { usePathname } from "next/navigation";

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
  ```
  Match this file's shape: named export, typed props inline, no default
  export, styles via a semantic class name defined in `src/styles/components.css`
  (per CLAUDE.md's "semantic classes in markup, utilities in CSS" rule — do
  not add Tailwind utility classes directly to the new button's JSX).
- Button convention: `src/components/ui/button.tsx` exports `Button` and
  `buttonClasses`. The toggle is a distinct, small, icon-driven control (not
  a call-to-action), so it should **not** reuse `Button`/`.button` styling —
  give it its own `.theme-toggle` block in `src/styles/components.css`,
  matching the file's existing BEM-style pattern (`.block`, `.block__element`).
- Touch target rule (CLAUDE.md): "standalone interactive elements are at
  least 44px (`min-h-11`)" — the toggle is a standalone control, so it needs
  `min-h-11` (and a matching min-width) or the equivalent in
  `.theme-toggle`'s CSS.
- Accessibility test pattern to match, `tests/interactions.spec.ts:1-8`
  (imports and the shared `open` helper):
  ```ts
  import AxeBuilder from "@axe-core/playwright";
  import { expect, test, type Page } from "@playwright/test";
  import { hydrated } from "./routes";

  async function open(page: Page, route: string) {
    await page.goto(route);
    await page.locator(hydrated).waitFor({ state: "attached" });
  }
  ```
  and the existing dark/light emulation pattern (`tests/interactions.spec.ts:274-283`):
  ```ts
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      violations.map((v) => `${colorScheme}: ${v.id}`),
      colorScheme,
    ).toEqual([]);
  }
  ```

## Commands you will need

| Purpose        | Command                                     | Expected on success                                                                                                                                        |
| -------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contrast check | `pnpm check:contrast`                       | `69 pairings x 2 themes, all pass.` (unaffected — this plan adds no new role values)                                                                       |
| Test suite     | `pnpm test`                                 | all pass, including the new toggle tests                                                                                                                   |
| Format         | `pnpm format`                               | exits 0                                                                                                                                                    |
| Lint           | `pnpm lint`                                 | exits 0                                                                                                                                                    |
| Build          | `pnpm build`                                | exits 0                                                                                                                                                    |
| Manual check   | `pnpm dev`, open any page, click the toggle | theme changes immediately, persists across a manual reload, and (with OS set to the opposite scheme) still shows the manually-chosen theme, not the OS one |

## Scope

**In scope**:

- `src/components/theme-toggle.tsx` (new) — the client component.
- `src/components/site-header.tsx` — render `<ThemeToggle />` in the header.
- `src/styles/components.css` — new `.theme-toggle` block.
- `src/styles/roles.css` — add `:root[data-theme="dark"]` rules mirroring the
  existing `@media (prefers-color-scheme: dark)` block, and guard that media
  block with `:not([data-theme="light"])` so an explicit light choice beats
  a dark OS preference.
- `src/styles/theme.css` — add `color-scheme` overrides for the two explicit
  states.
- `src/app/layout.tsx` — add the inline blocking script, `suppressHydrationWarning`
  on `<html>`.
- `tests/interactions.spec.ts` — new test(s) for the toggle.

**Out of scope** (do NOT touch):

- Any role's light or dark _value_ — this plan only adds a second trigger for
  values that already exist; it does not change what any role means.
- `scripts/contrast.mjs` / `scripts/figma-manifest.mjs` — per
  `plans/010-shared-css-var-parser.md`'s maintenance note, the new
  `:root[data-theme="dark"]` block is **not** parsed by either script (they
  only understand the `@media` block). This plan keeps the two blocks
  byte-identical (see Step 2) and adds a same-file test asserting that, so
  the contrast/Figma tooling's blind spot doesn't matter — do not attempt to
  teach `contrast.mjs` or `figma-manifest.mjs` about `data-theme` in this
  plan; that's out of scope and belongs with plan 010 if ever needed.
- `next-themes` or any third-party theme-switching library — the project has
  no such dependency today and the mechanism needed here (one attribute, one
  small script, plain CSS) doesn't warrant adding one.
- Any other component's styling.

## Git workflow

- Branch: `advisor/013-manual-theme-toggle`
- Commit per step. Message style: conventional commits, e.g. `feat(theme):
add manual light/dark toggle with data-theme override`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: inline blocking script in the root layout

In `src/app/layout.tsx`, add `suppressHydrationWarning` to `<html>` (the
script sets an attribute the server doesn't know about, which would
otherwise trigger a hydration warning) and inject a small inline script in
`<head>` that runs before paint:

```tsx
import { fontClasses } from "@/lib/fonts";

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontClasses} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

No `theme` value in `localStorage` (the default, "system") means no
`data-theme` attribute is set, and the existing `@media` rule governs —
identical behavior to today.

**Verify**: `pnpm build` succeeds; `grep -n "suppressHydrationWarning"
src/app/layout.tsx` matches.

### Step 2: `data-theme` overrides in `roles.css`

Change the dark media query's selector from `:root` to
`:root:not([data-theme="light"])`, and add a new rule right after it with
**the exact same declarations**, selected by `:root[data-theme="dark"]`
instead of the media query. Plain CSS has no mixin/include mechanism, so the
declarations are duplicated on purpose — guard against drift with a comment
linking the two blocks, and with Step 6's test:

```css
/* Dark: only what differs from light. Kept byte-identical to the
   :root[data-theme="dark"] block below — a test in
   tests/interactions.spec.ts asserts they match. If you change one, change
   both, or the manual toggle and the OS-preference path will disagree. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* ...unchanged, exact copy of today's declarations... */
  }
}

/* Forced dark via the toggle (src/components/theme-toggle.tsx), regardless
   of OS preference. Must stay byte-identical to the block above. */
:root[data-theme="dark"] {
  /* ...same declarations as the media block above... */
}
```

**Verify**: `pnpm check:contrast` still reports `69 pairings x 2 themes, all
pass.` (this script only reads the `@media` block per
`plans/010-shared-css-var-parser.md`'s maintenance note, so it is a no-op
check here — the real verification is Step 6's new test).

### Step 3: `color-scheme` overrides in `theme.css`

Add explicit `color-scheme` for the two forced states, so native form
controls and scrollbars follow the manual choice too:

```css
:root {
  color-scheme: light dark;
}

:root[data-theme="light"] {
  color-scheme: light;
}

:root[data-theme="dark"] {
  color-scheme: dark;
}
```

**Verify**: `grep -n "data-theme" src/styles/theme.css` shows both new rules.

### Step 4: the `ThemeToggle` component

Create `src/components/theme-toggle.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

const next: Record<Theme, Theme> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const labels: Record<Theme, string> = {
  system: "Use system theme",
  light: "Use light theme",
  dark: "Use dark theme",
};

/**
 * Cycles system -> light -> dark -> system. Persists to localStorage; the
 * inline script in src/app/layout.tsx applies the stored choice before
 * paint, so there is no flash on load. Reads the current value from the DOM
 * (set by that script) rather than localStorage directly, so it starts in
 * sync with whatever the blocking script already applied.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    setTheme(attr === "light" || attr === "dark" ? attr : "system");
  }, []);

  function cycle() {
    const value = next[theme];
    setTheme(value);
    if (value === "system") {
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem("theme");
    } else {
      document.documentElement.setAttribute("data-theme", value);
      localStorage.setItem("theme", value);
    }
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={labels[theme]}
      onClick={cycle}
    >
      <span aria-hidden="true" className="theme-toggle__icon" />
    </button>
  );
}
```

Add `.theme-toggle` to `src/styles/components.css`, following the file's
existing BEM pattern (look at an existing block, e.g. `.filter-chip` or
`.button`, for the structure — border via `outline` role, `min-h-11
min-w-11` applied via `@apply` inside the block per CLAUDE.md's "utilities
inside semantic classes" rule, hover using the `hover` role, and swap
`.theme-toggle__icon`'s `mask-image`/background per the current `data-theme`
if you want distinct sun/moon/system glyphs — a plain text label
(`"☀"`/`"🌙"`/`"⚙"` or similar) is also acceptable and simpler; either way
the accessible name comes from `aria-label`, not the glyph, so the icon can
be purely decorative (`aria-hidden`)).

**Verify**: `pnpm lint` passes with no new errors; the component renders
without a hydration mismatch warning in the browser console when loaded with
`pnpm dev`.

### Step 5: wire it into the header

In `src/components/site-header.tsx`, import and render `<ThemeToggle />`
inside `<nav className="site-nav">`, after the mapped `links` and before (or
after — pick one, note the choice) the `Request` button.

**Verify**: `pnpm dev`, open `/`, confirm the toggle renders in the header
and is reachable by keyboard (Tab) with a visible focus ring
(`:focus-visible` from `src/app/globals.css:57-60` applies automatically to
any real `<button>`, which this is).

### Step 6: byte-identical-blocks test, plus interaction/axe tests

In `tests/interactions.spec.ts`, add:

```ts
test("dark-mode role block in roles.css matches its data-theme twin", async () => {
  const { readFile } = await import("node:fs/promises");
  const css = await readFile("src/styles/roles.css", "utf8");
  const media = css.match(
    /@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme="light"\]\) \{([^}]*)\}/,
  );
  const attr = css.match(/:root\[data-theme="dark"\] \{([^}]*)\}/);
  expect(media?.[1]?.trim()).toBeTruthy();
  expect(attr?.[1]?.trim()).toBe(media?.[1]?.trim());
});

test("theme toggle overrides OS preference and persists", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await open(page, "/");

  const background = () =>
    page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue(
        "--background",
      ),
    );
  const lightBackground = await background();

  const toggle = page.getByRole("button", { name: /theme/i });
  await toggle.click(); // system -> light (no visible change, still light)
  await toggle.click(); // light -> dark
  await expect.poll(background).not.toBe(lightBackground);

  await page.reload();
  await page.locator(hydrated).waitFor({ state: "attached" });
  expect(await background()).not.toBe(lightBackground); // persisted

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
});
```

Adjust the exact click sequence/assertions if `ThemeToggle`'s cycle order
differs from what you implemented in Step 4 — the point of the test is:
(1) the two CSS blocks stay identical, (2) clicking the toggle changes the
rendered theme regardless of OS preference, (3) the choice survives a
reload, (4) the forced theme still passes axe.

**Verify**: `pnpm test` → all pass, including these two new tests.

### Step 7: gate

`pnpm format`, `pnpm lint`, `pnpm build`, `pnpm check:contrast`, `pnpm test`
— all exit 0.

## Test plan

- New tests in `tests/interactions.spec.ts` (Step 6): one static test
  asserting the two dark-mode CSS blocks are textually identical (catches
  the drift risk called out in Step 2's comment), one Playwright test
  covering the toggle's actual behavior (overrides OS preference, persists
  across reload, passes axe while forced).
- Model both after the existing `colorScheme` emulation pattern at
  `tests/interactions.spec.ts:274-283` and the existing `open()`/`hydrated`
  helpers already imported at the top of the file.
- Verification: `pnpm test` → all pass, new tests included in the count.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm build` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm check:contrast` exits 0, still reports `69 pairings x 2 themes, all pass.`
- [ ] `pnpm test` exits 0, including the two new tests from Step 6
- [ ] `grep -n 'data-theme="dark"' src/styles/roles.css` and `grep -n
    'prefers-color-scheme: dark' src/styles/roles.css` both match
- [ ] `grep -n "suppressHydrationWarning" src/app/layout.tsx` matches
- [ ] `grep -n "ThemeToggle" src/components/site-header.tsx` matches
- [ ] No browser console hydration-mismatch warning when loading any page in `pnpm dev`
- [ ] `git status` shows changes only in the "In scope" file list above
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- You cannot make the `:root[data-theme="dark"]` block byte-identical to the
  `@media` block without introducing a CSS-nesting or specificity conflict —
  report the exact conflict rather than reordering/merging them in a way
  that changes which one wins.
- The inline script in `layout.tsx` causes a hydration mismatch warning
  anywhere in `pnpm dev`'s console — that means `suppressHydrationWarning`
  isn't scoped correctly or the script runs after React has already
  hydrated; report the exact warning text.
- `pnpm test`'s axe check finds a violation on the toggle button itself
  (e.g. insufficient contrast, missing accessible name) — fix within this
  plan's scope (the button's own styling/labeling) rather than suppressing
  the violation.
- You find that `next dev`/`next build`'s React Compiler (`babel-plugin-react-compiler`,
  see `package.json` devDependencies) rejects the `dangerouslySetInnerHTML`
  script pattern or the `useEffect` in `ThemeToggle` for a reason not
  anticipated here — report the exact compiler error.

## Maintenance notes

- If a future change adds a _third_ variant of the dark declarations (e.g. a
  high-contrast mode), extend both the `@media` and `data-theme` blocks
  together, and extend Step 6's byte-identical test accordingly — don't let
  a third variant reintroduce the drift risk this plan closes for two.
- If `plans/010-shared-css-var-parser.md` lands later and someone wants
  `check:contrast`/`figma-manifest` to validate the forced-dark path too
  (not just assert textual equality), that's a real follow-up — the shared
  parser from that plan would need to learn about attribute-selector blocks,
  which its own maintenance notes already flag as unhandled.
- A reviewer should scrutinize: the exact cycle order and icon choice in
  `ThemeToggle` (a product/design call this plan made a reasonable default
  for, not a hard requirement), and whether `localStorage` is acceptable here
  (it is a per-visitor preference, not sensitive data, so this doesn't
  conflict with the project's cookieless-analytics stance).
