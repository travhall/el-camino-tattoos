# Plan 022: Add a header topbar (walk-ins note, location, theme toggle)

**Planned at:** commit `581fd6b`, 2026-09-30

**Executor preamble:** Read this entire plan before touching anything. Run
the drift check below first. If it reports any difference, STOP and report
back instead of guessing how to reconcile it — the plan's exact-code steps
assume the baseline below is unchanged.

**Drift check:**

```bash
git diff --stat 581fd6b..HEAD -- src/components/site-header.tsx src/styles/components.css src/lib/content.ts
```

Expected output: nothing (empty diff). If it isn't empty, STOP and report.

## Status

TODO

## Why this matters

The reviewed dark-themed design mock splits the header into two bands: a
slim **topbar** above the main nav (walk-ins availability + shop location +
theme toggle) and the main header (logo, primary nav, the booking CTA). The
owner picked "header/footer visual pass" as the next phase of porting that
mock's direction into this codebase (see `plans/README.md`'s design-port
section for the full context — accent translated red→gold, dark is now
default, shapes are sharp).

Right now this site's header has no topbar: the theme toggle sits inside the
main nav alongside the page links, and there's no persistent walk-ins or
location signal above the fold. The shop's walk-in-friendly policy
(`site.walkIns`/`site.walkInNote`, already in the content model from the
original shop-facts audit) is currently only mentioned on the homepage,
not persistently in the header.

This plan adds the topbar using data that already exists in the `Site`
content type — no schema change, no new Keystatic fields.

## Current state

`src/components/site-header.tsx` (full file):

```tsx
import Link from "next/link";
import { SiteLogo } from "@/components/site-logo";
import { NavLink } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui/button";

export const navLinks = [
  { href: "/artists", label: "Artists" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/aftercare", label: "Aftercare" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand">
          <SiteLogo className="site-header__logo" />
          <span className="visually-hidden">El Camino Tattoos</span>
        </Link>
        <nav aria-label="Primary" className="site-nav">
          {navLinks.map(({ href, label }) => (
            <NavLink key={href} href={href} className="site-nav__link">
              {label}
            </NavLink>
          ))}
          <ThemeToggle />
          {/* Persistent booking slot; points at /contact until a booking flow exists. */}
          <ButtonLink href="/contact">Request</ButtonLink>
        </nav>
      </div>
    </header>
  );
}
```

`src/styles/components.css` (relevant block, lines 6-35):

```css
  /* Site shell */
  .site-header {
    @apply border-b border-line;
  }

  .site-header__inner {
    @apply mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-fluid-md gap-y-fluid-xs px-fluid-sm py-fluid-sm;
  }

  .site-header__brand {
    @apply inline-flex min-h-11 items-center;
  }

  .site-header__logo {
    @apply h-5 w-auto md:h-6;
  }

  .site-nav {
    @apply flex flex-wrap items-center gap-x-fluid-md gap-y-fluid-3xs;
  }

  /* 44px tall hit area; current page/section is marked by an underline as
     well as aria-current, so it isn't conveyed by color alone. */
  .site-nav__link {
    @apply inline-flex min-h-11 items-center hover:underline;
  }

  .site-nav__link[aria-current] {
    @apply underline decoration-nav-current decoration-2 underline-offset-8;
  }
```

`src/components/theme-toggle.tsx` (full file, unchanged by this plan — read
it to understand the component you are moving, not editing):

```tsx
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

const THEME_CHANGE_EVENT = "elcamino:theme-change";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
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
```

The `Site` content type already has everything the topbar needs
(`src/lib/content.ts`, lines 148-162 — do not edit this file, it's shown so
you know the fields exist and don't invent new ones):

```ts
export type Site = {
  description: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  hours: readonly { days: string; time: string }[];
  walkIns: boolean;
  walkInNote: string;
  consultationNote: string;
  depositAmount: number | null;
  instagram: string;
};
```

`src/components/site-footer.tsx` already shows the pattern for a header-tier
component that reads site content (it's an `async function` that calls
`getSite()`):

```tsx
import { NavLink } from "@/components/nav-link";
import { navLinks } from "@/components/site-header";
import { ShopInfo } from "@/components/shop-info";
import { ButtonLink } from "@/components/ui/button";
import { getSite } from "@/lib/content";
import { siteName } from "@/lib/site";

export async function SiteFooter() {
  const site = await getSite();
  // ...
}
```

`SiteHeader` is currently **not** async — it has no data dependency. This
plan makes it async, following that same `SiteFooter` pattern.

Test coverage you must not break — `tests/interactions.spec.ts`, line 473:

```ts
const toggle = page.getByRole("button", { name: /theme/i });
```

This locator throws if more than one button matches `/theme/i` on the page.
**There must be exactly one `<ThemeToggle />` rendered per page** after this
plan — you are moving it into the topbar, not adding a second instance.

## Commands you will need

| Purpose | Command |
|---|---|
| Typecheck | `pnpm exec tsc --noEmit` |
| Lint | `pnpm lint` |
| Format check | `pnpm format:check` |
| Format write | `pnpm format` |
| Seed test fixtures | `node scripts/fixtures.mjs seed` |
| Clean test fixtures | `node scripts/fixtures.mjs clean` |
| Full test suite (builds + seeds + Playwright) | `pnpm test` |
| Dev server | `node_modules/.bin/next dev --port <port>` (pick an unused port) |

## Scope

**In scope:**
- `src/components/site-header.tsx` — add the topbar, make the component
  async, fetch `site` via `getSite()`.
- `src/styles/components.css` — new topbar rules.
- `tests/interactions.spec.ts` and/or `tests/site.spec.ts` — add coverage
  for the topbar's content and the moved theme toggle.

**Out of scope — do not touch:**
- `src/lib/content.ts` / `keystatic.config.ts` — no schema change, the
  `Site` type already has every field this plan needs.
- `src/components/theme-toggle.tsx` — moved, not edited.
- `src/components/site-footer.tsx` — that's plan 023, a separate plan.
- A mobile hamburger / slide-down nav menu. The mock has one; this
  codebase's current header instead flex-wraps the nav at narrow widths,
  which already passes the a11y and touch-target suites. Changing that
  interaction pattern is a bigger, separate decision — not part of this
  plan. If you find yourself wanting to add a `<button aria-expanded>`
  menu toggle, STOP and report instead — that's scope creep on this plan.
- Any icon/SVG system. This codebase has no icon component library (only
  `src/app/icon.svg`, the favicon). The mock's topbar uses a star icon next
  to the walk-ins text; render that line as text only, no icon.

## Git workflow

Work in your isolated worktree. Commit when each step's verification
passes. Suggested commit granularity: one commit for the component + CSS
change, one for the tests. Do not merge, push, or touch any branch besides
your own worktree's.

## Steps

### Step 1 — Add the topbar to `SiteHeader`

Replace the full contents of `src/components/site-header.tsx` with:

```tsx
import Link from "next/link";
import { SiteLogo } from "@/components/site-logo";
import { NavLink } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui/button";
import { getSite } from "@/lib/content";

export const navLinks = [
  { href: "/artists", label: "Artists" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/aftercare", label: "Aftercare" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export async function SiteHeader() {
  const site = await getSite();
  const cityLine = [site.city, site.region].filter(Boolean).join(", ");

  return (
    <>
      {(site.walkInNote || cityLine) && (
        <div className="site-topbar">
          <div className="site-topbar__inner">
            {site.walkInNote ? (
              <Link href="/contact" className="site-topbar__walkin">
                {site.walkInNote}
              </Link>
            ) : (
              <span />
            )}
            <div className="site-topbar__right">
              {cityLine && (
                <span className="site-topbar__location">{cityLine}</span>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
      <header className="site-header">
        <div className="site-header__inner">
          <Link href="/" className="site-header__brand">
            <SiteLogo className="site-header__logo" />
            <span className="visually-hidden">El Camino Tattoos</span>
          </Link>
          <nav aria-label="Primary" className="site-nav">
            {navLinks.map(({ href, label }) => (
              <NavLink key={href} href={href} className="site-nav__link">
                {label}
              </NavLink>
            ))}
            {!(site.walkInNote || cityLine) && <ThemeToggle />}
            {/* Persistent booking slot; points at /contact until a booking flow exists. */}
            <ButtonLink href="/contact">Request</ButtonLink>
          </nav>
        </div>
      </header>
    </>
  );
}
```

Notes on this code, read before you implement:
- The topbar only renders when there's content for it (`walkInNote` or a
  city). This matches the existing pattern in `ShopInfo`/`getAftercare` of
  "every field optional, render only what's filled in" — don't make it
  unconditional.
- The theme toggle lives in **either** the topbar **or** the main nav,
  never both — the `!(site.walkInNote || cityLine)` fallback keeps exactly
  one `<ThemeToggle />` on the page even when there's no topbar content
  (e.g. a fresh Keystatic install with an empty Shop Info singleton). This
  is what keeps `tests/interactions.spec.ts`'s
  `page.getByRole("button", { name: /theme/i })` locator unambiguous in
  every content state.
- `SiteHeader` is now `async` — confirm its one caller,
  `src/components/site-shell.tsx`, already renders it as `<SiteHeader />`
  inside a component tree that supports async Server Components (it does —
  `SiteFooter` is already async and rendered the same way in that same
  file). You do not need to change `site-shell.tsx`.

**Verify:**

```bash
pnpm exec tsc --noEmit
```

Expect no new errors. (Any pre-existing unrelated errors from `.next/types`
not existing yet are not yours to fix — confirm by checking whether they
appear even before your change, e.g. via `git stash`.)

### Step 2 — Style the topbar

In `src/styles/components.css`, add this block immediately after the
`.site-header__logo` rule (before `.site-nav`):

```css
  .site-topbar {
    @apply border-b border-line bg-surface-sunken text-sm text-subtle;
  }

  .site-topbar__inner {
    @apply mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-fluid-md gap-y-fluid-3xs px-fluid-sm py-fluid-2xs;
  }

  .site-topbar__walkin {
    @apply inline-flex min-h-11 items-center hover:underline;
  }

  .site-topbar__right {
    @apply flex items-center gap-fluid-sm;
  }

  .site-topbar__location {
    @apply hidden sm:inline;
  }
```

Rationale for the roles used (per `roles.css`'s own guidance, read its
header comment if you need the full role list):
- `surface-sunken` — "recessed areas: section bands, the footer, wells."
  The topbar is a thin recessed band above the main header, the same
  semantic role the footer already uses for its background.
- `text-subtle` — "third text tier: captions, footer links, labels on
  photos." The topbar is secondary information, not primary nav.
- The location text (`site-topbar__location`) hides below the `sm`
  breakpoint — on a phone-width screen there isn't room for walk-in text,
  theme toggle, and a city name on one line without wrapping awkwardly.
  This mirrors the mock's own topbar, which also drops the location text
  on narrow viewports (check its CSS if you want to confirm, but you don't
  need to — this is a judgment call already made for you).

**Do not** invent a new role or reach for a ramp step directly (e.g.
`bg-paper-800`) — this codebase's styling conventions (see this repo's
CLAUDE.md, "Styling conventions") require roles only in component CSS.

**Verify:**

```bash
pnpm format:check
pnpm lint
```

### Step 3 — Add test coverage

In `tests/interactions.spec.ts`, find the existing theme test (search for
`theme defaults to dark`). Confirm it still passes unmodified after your
change — it uses `page.getByRole("button", { name: /theme/i })`, which must
still match exactly one element.

Add a new test in the same file (near the theme test, or in a new
`describe("header topbar")` block — match the file's existing style):

```ts
test("the topbar shows the walk-in note and persists through theme toggle", async ({
  page,
}) => {
  await open(page, "/");

  const topbar = page.locator(".site-topbar");
  await expect(topbar).toBeVisible();
  await expect(
    topbar.getByRole("link", { name: /walk-in/i }),
  ).toHaveAttribute("href", "/contact");

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
});
```

Before writing this, check the test fixtures' `site.walkInNote` value
(`scripts/fixtures.mjs`, the `fixtures.site` object or similar) and adjust
the `name: /walk-in/i` regex if the actual fixture text doesn't contain
"walk-in" case-insensitively — read the fixture, don't guess.

**Verify:**

```bash
node scripts/fixtures.mjs seed
pnpm test --grep "topbar"
node scripts/fixtures.mjs clean
```

Expect the new test to pass.

### Step 4 — Full verification pass

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm format:check
pnpm test
```

All must exit 0. The full suite includes the axe sweep over every route in
`tests/routes.ts` at phone/desktop and light/dark — the topbar renders on
every page (it's in `SiteShell`), so this is your real cross-page a11y
check, not just the one new test.

### Step 5 — Manual visual check

```bash
node scripts/fixtures.mjs seed
node_modules/.bin/next dev --port <pick-an-unused-port>
```

Visit `/` in a browser. Confirm:
- A topbar strip appears above the main header, with the walk-in note on
  the left and the theme toggle (and location, at desktop width) on the
  right.
- Toggling the theme works from its new location and still persists on
  reload.
- At a narrow (phone) width, the location text disappears but the topbar
  doesn't visually break or overlap.

Then stop the dev server and clean fixtures:

```bash
node scripts/fixtures.mjs clean
```

## Test plan

- New: `tests/interactions.spec.ts` — topbar renders, walk-in link points
  at `/contact`, no new axe violations (Step 3).
- Existing, must still pass unmodified: the `theme defaults to dark...`
  test (confirms the toggle's new location doesn't break the single-button
  locator or persistence behavior).
- Existing, must still pass: the full `pnpm test` a11y sweep (the topbar
  touches every route via `SiteShell`).

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0 (no new errors)
- [ ] `pnpm lint` and `pnpm format:check` exit 0
- [ ] `pnpm test` exits 0, including the new topbar test
- [ ] Exactly one `<ThemeToggle />` renders per page in every content state
      (topbar present or absent) — confirmed by the existing theme test
      passing unmodified
- [ ] Visiting `/` in `pnpm dev` shows the topbar with working theme toggle
      and walk-in link, confirmed visually in both themes
- [ ] No files outside the in-scope list modified
- [ ] `plans/README.md` status row updated for plan 022

## STOP conditions

- If `src/components/site-shell.tsx` does NOT already render `SiteFooter`
  as an awaited/async Server Component the same way this plan expects
  `SiteHeader` to work, STOP and report — the async conversion needs a
  different approach than this plan assumes.
- If the test fixtures have no `walkInNote` value (so the new topbar never
  renders during tests), STOP and report rather than inventing fixture
  content — fixture changes belong in a reviewed step, not an improvisation.
- If adding the topbar's axe sweep surfaces a real contrast violation on
  `surface-sunken` + `text-subtle` in either theme, STOP and report the
  exact violation — do not swap in a different role pairing without review.

## Maintenance notes

- If the shop ever gets a persistent announcement-bar need beyond walk-ins
  (e.g. a holiday closure notice), this topbar is the natural place to grow
  — but that's a future decision, not scoped here.
- The topbar reads `site.walkInNote`/`site.city`/`site.region`, all already
  editable in Keystatic's "Shop info" singleton — no editor-facing changes
  needed from this plan.
