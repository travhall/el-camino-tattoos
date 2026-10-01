# Plan 020: Repeat the nav and add a booking CTA in the footer

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 881ef16..HEAD -- src/components/site-footer.tsx src/components/site-header.tsx src/components/shop-info.tsx src/styles/components.css`
> Compare the "Current state" excerpts against the live code before
> proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction (design-system change, owner-approved)
- **Planned at**: commit `881ef16`, 2026-09-30; Scope expanded to include one line of `tests/interactions.spec.ts` after a first execution attempt found plan 019's Artists-page test collided with this plan's footer CTA (see Step 3a) — 2026-09-30

## Why this matters

The reviewed design mock's footer repeats the primary nav and gives a
visitor who scrolls all the way down a direct way to book, instead of
making them scroll back to the header. Today's footer is just the shop's
address/hours (`<ShopInfo>`) and a copyright line — no nav, no CTA. This
plan adds both, reusing the exact same 5 nav links already defined in
`SiteHeader` (exported instead of duplicated) and the exact same
"Request an appointment" pattern already used by the header's persistent
booking slot and (after plan 019) the Artists page.

Separately, while touching this file: `.site-footer` currently uses
`bg-surface`, but `src/styles/roles.css`'s own header comment defines
`surface-sunken` as the role for "recessed areas: section bands, **the
footer**, wells" — the footer has never actually used the role documented
for it. This plan fixes that one-line mismatch since it's directly in the
file being touched; it is not a broader design change.

## Current state

`src/components/site-footer.tsx` (full file, 18 lines):

```tsx
import { ShopInfo } from "@/components/shop-info";
import { getSite } from "@/lib/content";
import { siteName } from "@/lib/site";

export async function SiteFooter() {
  const site = await getSite();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <ShopInfo site={site} />
        <p>
          © {new Date().getFullYear()} {siteName}
        </p>
      </div>
    </footer>
  );
}
```

`src/components/site-header.tsx` (full file, 37 lines) — the `links` array
this plan exports and reuses:

```tsx
import Link from "next/link";
import { SiteLogo } from "@/components/site-logo";
import { NavLink } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui/button";

const links = [
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
          {links.map(({ href, label }) => (
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

`src/components/nav-link.tsx` (full file, 34 lines, unchanged by this plan
— `NavLink` is a client component already safe to render from a server
component like `SiteFooter`, exactly as `SiteHeader` already does):

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

`src/components/shop-info.tsx` (full file, 64 lines) is unchanged by this
plan — every part is already optional and self-hides, so it slots into a
new grid column without modification.

`src/styles/components.css`, the relevant current rules (lines 37–68):

```css
  .site-footer {
    @apply mt-auto border-t border-line bg-surface;
  }

  .site-footer__inner {
    @apply mx-auto grid max-w-6xl gap-fluid-md px-fluid-sm py-fluid-lg text-sm text-muted;
  }

  /* Shop details: address and contact on one side, hours on the other. */
  .shop-info {
    @apply grid items-start gap-fluid-md md:grid-cols-2;
  }
  ...
```

(`.shop-info` and its children are unchanged — shown above only so you can
see where `.site-footer`/`.site-footer__inner` sit in the file.)

`src/styles/roles.css`'s header comment documents `surface-sunken` as:
`surface-sunken ... recessed areas: section bands, the footer, wells`.

## Commands you will need

| Purpose   | Command                                               | Expected on success |
| --------- | ----------------------------------------------------- | ------------------- |
| Typecheck | `pnpm exec tsc --noEmit`                              | exit 0, no output   |
| Lint      | `pnpm lint`                                           | exit 0              |
| Format    | `pnpm format:check` (fix with `pnpm format`)          | exit 0              |
| Tests     | `pnpm test` (seeds fixtures, builds, runs Playwright) | all pass            |
| One test  | `pnpm test --grep "footer"`                           | matching tests pass |

Use `pnpm` only.

## Scope

**In scope** (the only files you should modify):

- `src/components/site-header.tsx` (export the `links` array only — rename to `navLinks` for a clearer public name; no other change)
- `src/components/site-footer.tsx`
- `src/styles/components.css` (`.site-footer`/`.site-footer__inner` plus new rules; do not touch `.shop-info*` or any unrelated rule)
- `tests/interactions.spec.ts` (one line only — added after a first execution attempt found this dependency the plan missed; see Step 3a below)

**Out of scope** (do NOT touch):

- `src/components/shop-info.tsx`, `src/components/nav-link.tsx` — used as-is.
- `src/components/site-header.tsx`'s markup, `ThemeToggle`, or the header's own `ButtonLink` — only the `links` export changes.
- `scripts/figma-manifest.mjs` — no new tracked layout value.
- Any other page or component.

## Git workflow

- Branch: `advisor/020-footer-nav-cta`
- One commit, e.g. `feat(footer): repeat the nav and add a booking CTA`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Export the nav links from `SiteHeader`

In `src/components/site-header.tsx`, rename the local `links` constant to
`navLinks` and export it:

```ts
export const navLinks = [
  { href: "/artists", label: "Artists" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/aftercare", label: "Aftercare" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;
```

Update the one usage inside `SiteHeader` itself (`links.map(...)` →
`navLinks.map(...)`). Nothing else in this file changes.

**Verify**: `pnpm exec tsc --noEmit` → exit 0. `grep -n "export const navLinks" src/components/site-header.tsx` → one match.

### Step 2: Rewrite `SiteFooter`

Replace `src/components/site-footer.tsx` in full:

```tsx
import { NavLink } from "@/components/nav-link";
import { navLinks } from "@/components/site-header";
import { ShopInfo } from "@/components/shop-info";
import { ButtonLink } from "@/components/ui/button";
import { getSite } from "@/lib/content";
import { siteName } from "@/lib/site";

export async function SiteFooter() {
  const site = await getSite();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <p className="site-footer__name">{siteName}</p>
          <nav aria-label="Footer" className="site-footer__nav">
            {navLinks.map(({ href, label }) => (
              <NavLink key={href} href={href} className="site-footer__nav-link">
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <ShopInfo site={site} />
        <div className="site-footer__cta">
          <ButtonLink href="/contact">Request an appointment</ButtonLink>
        </div>
      </div>
      <p className="site-footer__copyright">
        © {new Date().getFullYear()} {siteName}
      </p>
    </footer>
  );
}
```

**Verify**: `pnpm exec tsc --noEmit && pnpm lint` → both exit 0.

### Step 3: Update the CSS

Replace lines 37–43 of `src/styles/components.css` (the current
`.site-footer`/`.site-footer__inner` rules quoted in "Current state") with:

```css
.site-footer {
  @apply mt-auto border-t border-line bg-surface-sunken;
}

.site-footer__inner {
  @apply mx-auto grid max-w-6xl gap-fluid-lg px-fluid-sm pt-fluid-lg text-sm text-muted md:grid-cols-3;
}

.site-footer__brand {
  @apply grid gap-fluid-sm;
}

.site-footer__name {
  @apply font-medium text-foreground;
}

.site-footer__nav {
  @apply grid gap-fluid-2xs;
}

/* Mirrors .site-nav__link's state styling (44px hit area; current page is
     an underline, not color alone), kept separate rather than shared with
     the header's .site-nav__link so the footer's vertical layout doesn't
     depend on overriding the header nav's flex-row rule. */
.site-footer__nav-link {
  @apply inline-flex min-h-11 items-center hover:underline;
}

.site-footer__nav-link[aria-current] {
  @apply underline decoration-nav-current decoration-2 underline-offset-4;
}

.site-footer__cta {
  @apply flex items-start md:justify-self-end;
}

.site-footer__copyright {
  @apply mx-auto max-w-6xl px-fluid-sm py-fluid-sm text-sm text-muted;
}
```

**Verify**: `grep -n "site-footer {" -A1 src/styles/components.css` shows `bg-surface-sunken` on the line after `.site-footer {` (the plan's originally-suggested single-line grep doesn't match because `@apply` sits on its own line under this file's formatting — that's a plan-text issue, not a sign anything is wrong; confirm by direct inspection if grep is inconclusive). `pnpm lint` (exit 0) since it also lints Tailwind class usage in this repo's config.

### Step 3a: Fix a test broken by the new footer CTA (discovered mid-execution — read this even if you think Steps 1–3 already "worked")

Plan 019 (already merged to `main`) added a test in `tests/interactions.spec.ts` that asserts on the Artists page's "Request an appointment" link by accessible name alone:

```ts
  test("offers a match-me CTA and a traveling-tattooer contact", async ({
    page,
  }) => {
    await open(page, "/artists");
    await expect(
      page.getByRole("heading", { name: "Not sure who’s right for you?" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Request an appointment" }),
    ).toHaveAttribute("href", "/contact");
```

This plan's Step 2 adds a second link with the exact same accessible name
("Request an appointment") to the footer, which now renders on every page
including `/artists`. Playwright's `getByRole` locator is strict by
default — two matches makes it throw
(`strict mode violation: ... resolved to 2 elements`), failing this test
and therefore `pnpm test`.

The fix is to scope the existing locator to the page's main content
landmark, not to change either CTA's text (the plan intentionally reuses
"Request an appointment" verbatim in both places, matching the Artists
page's own CTA and the header's booking-slot pattern — an intentional,
repeated call to action, not an accidental duplicate). In
`tests/interactions.spec.ts`, change only this one locator (do not touch
anything else in this test or the file):

```ts
await expect(
  page.getByRole("main").getByRole("link", { name: "Request an appointment" }),
).toHaveAttribute("href", "/contact");
```

`page.getByRole("main")` matches the `<main>` landmark rendered by
`src/components/site-shell.tsx` (`<main id="main" tabIndex={-1} className="page">`)
on every page — this scopes the assertion to the Artists page's own CTA and
excludes the footer's, which is the correct fix regardless of how many
footer/nav elements ever share this text in the future.

**Verify**: `pnpm test --grep "offers a match-me CTA"` → passes.

### Step 4: Full verification

Run, in order: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm format:check`
(fix with `pnpm format` if needed), `pnpm test`.

`pnpm test` runs the axe sweep on every route (the footer renders on all of
them via `SiteShell`) in both themes at both widths, plus the existing
touch-target test — the new footer nav links and CTA button must all clear
44px and pass contrast; if axe flags the new `site-footer__nav-link` state
styling, compare it against `.site-nav__link`'s already-passing pattern in
the header rather than inventing a new approach.

**Verify**: all four commands exit 0.

## Test plan

No new dedicated test — the existing `"the footer shows the address"` test
in `tests/site.spec.ts` already opens a page and queries
`page.getByRole("contentinfo")` (the `<footer>`'s implicit landmark role),
which continues to work unchanged since the footer is still one `<footer>`
element. The full axe sweep (every route, both themes, both widths) and the
44px touch-target test are the regression guard for the new nav links and
CTA button. If you want an explicit check, you may add one assertion to
that existing test confirming the footer nav has a link to `/portfolio` —
optional, not required for done criteria.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0 and `pnpm format:check` exits 0
- [ ] `pnpm test` exits 0
- [ ] `grep -n "export const navLinks" src/components/site-header.tsx` shows the export
- [ ] `grep -n "navLinks" src/components/site-footer.tsx` shows it imported and used
- [ ] `grep -n "bg-surface-sunken" src/styles/components.css | grep -A0 site-footer` — `.site-footer` now uses the role documented for it
- [ ] Visiting any page in `pnpm dev` shows the footer with a repeated nav, a "Request an appointment" button, the shop info, and the copyright line, at both mobile and desktop widths
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts.
- Renaming `links` to `navLinks` in `site-header.tsx` breaks a test that
  asserts on the old name somewhere (unlikely — it's an internal constant,
  not previously exported — but confirm with
  `grep -rn "\blinks\b" tests/` before assuming it's safe).
- The axe sweep flags the footer nav's contrast or touch targets after
  Step 3 — report the specific route/theme/rule rather than adjusting a
  color role.

## Maintenance notes

- `navLinks` is now the single source of truth for the primary nav, used by
  both `SiteHeader` and `SiteFooter`. Any future nav change (add/remove/
  reorder a link) only needs to happen in `site-header.tsx`.
- `.site-footer__nav-link` deliberately duplicates `.site-nav__link`'s state
  logic rather than sharing it (see the code comment) — if a future change
  needs the header and footer nav links to always move in lockstep
  visually, consider factoring both into one shared rule at that point, not
  before.
- If the owner wants the footer's brand column to include the logo mark
  (not just the text name) or social links beyond what `<ShopInfo>` already
  shows, that's a follow-up — this plan keeps the brand column to name +
  nav, matching what was actually asked for (nav repeat + CTA), not a full
  redesign of every footer element.
