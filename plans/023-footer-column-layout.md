# Plan 023: Restructure the footer into labeled columns

**Planned at:** commit `581fd6b`, 2026-09-30

**Executor preamble:** Read this entire plan before touching anything. Run
the drift check below first. If it reports any difference, STOP and report
back instead of guessing how to reconcile it.

**Drift check:**

```bash
git diff --stat 581fd6b..HEAD -- src/components/site-footer.tsx src/components/shop-info.tsx src/styles/components.css tests/site.spec.ts tests/interactions.spec.ts
```

Expected output: nothing (empty diff). If it isn't empty, STOP and report.
(This plan was written against the same baseline as plan 022. If 022 has
already been executed and merged, this diff will show 022's changes to
`src/styles/components.css` and `src/components/site-header.tsx` — that's
expected and fine, since 022 doesn't touch the footer. Only STOP if the
diff shows changes to `site-footer.tsx`, `shop-info.tsx`, or the footer-
related test blocks shown below.)

## Status

TODO

## Why this matters

Plan 020 (merged) gave the footer a repeated nav and a prominent booking
CTA, but it's still a flat 3-column layout with no labeled grouping. The
reviewed dark-themed design mock organizes its footer into clearly headed
columns — "Find the shop," "Come on by," "Get in touch," "Take a look
around" — which makes a text-heavy footer scannable instead of a wall of
unlabeled contact details. The owner picked "header/footer visual pass" as
this phase of the design port (see `plans/README.md`'s design-port section).

This plan ports that labeled-column structure using data that already
exists in the `Site` content type — no schema change. It does require
splitting the existing `ShopInfo` component (which currently renders
address+phone+email+instagram and hours as one bundled block) into three
smaller pieces, because the mock's columns split that same data up
differently than `ShopInfo` currently does.

## Current state

`src/components/site-footer.tsx` (full file):

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

`src/components/shop-info.tsx` (full file):

```tsx
import type { Site } from "@/lib/content";
import { phoneHref } from "@/lib/site";

/**
 * Where to find and reach the shop, from the shop info. Every part is optional
 * and renders only when filled in. Links keep a 44px hit area.
 */
export function ShopInfo({ site }: { site: Site }) {
  const cityLine = [
    [site.city, site.region].filter(Boolean).join(", "),
    site.postalCode,
  ]
    .filter(Boolean)
    .join(" ");
  const hasAddress = Boolean(site.street || cityLine);
  const hasContact = hasAddress || site.phone || site.email || site.instagram;
  if (!hasContact && site.hours.length === 0) return null;

  return (
    <div className="shop-info">
      {hasContact && (
        <address className="shop-info__contact">
          {hasAddress && (
            <p>
              {site.street}
              {site.street && cityLine && <br />}
              {cityLine}
            </p>
          )}
          {site.phone && (
            <a href={phoneHref(site.phone)} className="link shop-info__link">
              {site.phone}
            </a>
          )}
          {site.email && (
            <a href={`mailto:${site.email}`} className="link shop-info__link">
              {site.email}
            </a>
          )}
          {site.instagram && (
            <a
              href={`https://instagram.com/${site.instagram}`}
              rel="noopener noreferrer"
              className="link shop-info__link"
            >
              @{site.instagram}
            </a>
          )}
        </address>
      )}
      {site.hours.length > 0 && (
        <dl className="shop-info__hours">
          {site.hours.map(({ days, time }) => (
            <div key={`${days}-${time}`} className="shop-info__hours-row">
              <dt className="shop-info__days">{days}</dt>
              <dd>{time}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
```

`ShopInfo` has exactly one caller in the whole codebase (confirmed by
`grep -rn "ShopInfo" src`): `site-footer.tsx` above. You are free to change
its exported shape because nothing else depends on today's single-component
API.

`src/styles/components.css` (the footer and shop-info blocks, lines 37-100):

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

  /* Shop details: address and contact on one side, hours on the other. */
  .shop-info {
    @apply grid items-start gap-fluid-md md:grid-cols-2;
  }

  .shop-info__contact {
    @apply grid justify-items-start gap-fluid-2xs not-italic;
  }

  .shop-info__link {
    @apply inline-flex min-h-11 items-center;
  }

  .shop-info__hours {
    @apply grid gap-1;
  }

  .shop-info__hours-row {
    @apply flex gap-2;
  }

  .shop-info__days {
    @apply font-medium text-foreground;
  }
```

`src/styles/typography.css` already has the pattern this plan uses for
column headings — a heading styled smaller than its semantic level (lines
41-47):

```css
  .caption {
    @apply text-xs text-muted;
  }

  .eyebrow {
    @apply text-sm font-medium tracking-wide text-muted uppercase;
  }
```

The file's own header comment explains why this is safe: "Headings are
styled by element AND by class, so visual level and document level stay
independent: `<h3 class="heading-1">`." Using `<h2 className="eyebrow">`
keeps the footer's column labels as real `h2` headings (for screen-reader
navigation) while looking like a small caps label, not a giant `h2`.

Tests that read today's footer markup and must still pass (read these
files' surrounding context yourself before editing; these are the exact
current assertions):

`tests/site.spec.ts`, lines 41-46:

```ts
test("the footer shows the address", async ({ page }) => {
  await open(page, "/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByText("310 Water Street")).toBeVisible();
  await expect(footer.getByText("Eau Claire, WI 54703")).toBeVisible();
});
```

`tests/interactions.spec.ts`, lines 502-513 (artists page test — scoped to
`main`, included here only so you can confirm your footer change doesn't
accidentally duplicate this accessible name outside `main` in a way that
breaks this locator; it's already scoped and should keep passing
unmodified):

```ts
test("offers a match-me CTA and a traveling-tattooer contact", async ({
  page,
}) => {
  await open(page, "/artists");
  // ...
  await expect(
    page
      .getByRole("main")
      .getByRole("link", { name: "Request an appointment" }),
  ).toHaveAttribute("href", "/contact");
  // ...
});
```

This test only matches links inside `<main>`. The footer's own "Request an
appointment" link lives in `<footer>` (the `contentinfo` landmark), so it
is already out of this test's scope — keep the footer's CTA text as
"Request an appointment" and this test is unaffected.

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
| Confirm `ShopInfo` has one caller | `grep -rn "ShopInfo" src --include="*.tsx"` |

## Scope

**In scope:**
- `src/components/shop-info.tsx` — split into three exports: `ShopAddress`,
  `ShopHours`, `ShopContact` (see Step 1 for exact code).
- `src/components/site-footer.tsx` — rewrite into a brand row plus a
  4-column grid (Find the shop / Come on by / Get in touch / Take a look
  around).
- `src/styles/components.css` — replace the `.site-footer__*` and
  `.shop-info*` rules with the new column layout.
- `tests/site.spec.ts` — the existing address test should still pass
  unmodified (verify, don't rewrite it unless it breaks); add coverage for
  the new column headings if it doesn't already exist.

**Out of scope — do not touch:**
- `src/lib/content.ts` / `keystatic.config.ts` — no schema change.
- `src/components/site-header.tsx` — that's plan 022, a separate plan. If
  022 has already landed, don't re-touch its topbar code.
- The footer's CTA button component (`ButtonLink` from
  `@/components/ui/button`) — plan 020 deliberately made this a real
  button, not a text link, per an explicit owner request. Keep it a
  `ButtonLink`, just relocate it into the "Get in touch" column — do not
  downgrade it to a plain `<Link>`.
- Moving the Instagram link out of the contact column into a separate
  "brand" row (the mock does this). Keep it inside `ShopContact` instead —
  that's one fewer markup region to maintain and the mock's placement isn't
  load-bearing to the direction being ported.

## Git workflow

Work in your isolated worktree. Commit when each step's verification
passes. Suggested commit granularity: one commit for the `shop-info.tsx`
split, one for the `site-footer.tsx` + CSS rewrite, one for tests. Do not
merge, push, or touch any branch besides your own worktree's.

## Steps

### Step 1 — Split `ShopInfo` into three exports

Replace the full contents of `src/components/shop-info.tsx` with:

```tsx
import type { Site } from "@/lib/content";
import { phoneHref } from "@/lib/site";

/** The shop's street address, or nothing if it isn't set. */
export function ShopAddress({ site }: { site: Site }) {
  const cityLine = [
    [site.city, site.region].filter(Boolean).join(", "),
    site.postalCode,
  ]
    .filter(Boolean)
    .join(" ");
  if (!site.street && !cityLine) return null;

  return (
    <address className="shop-info__contact">
      <p>
        {site.street}
        {site.street && cityLine && <br />}
        {cityLine}
      </p>
    </address>
  );
}

/** Phone, email and Instagram, each only if set. */
export function ShopContact({ site }: { site: Site }) {
  if (!site.phone && !site.email && !site.instagram) return null;

  return (
    <address className="shop-info__contact">
      {site.phone && (
        <a href={phoneHref(site.phone)} className="link shop-info__link">
          {site.phone}
        </a>
      )}
      {site.email && (
        <a href={`mailto:${site.email}`} className="link shop-info__link">
          {site.email}
        </a>
      )}
      {site.instagram && (
        <a
          href={`https://instagram.com/${site.instagram}`}
          rel="noopener noreferrer"
          className="link shop-info__link"
        >
          @{site.instagram}
        </a>
      )}
    </address>
  );
}

/** Opening hours, or nothing if none are set. */
export function ShopHours({ site }: { site: Site }) {
  if (site.hours.length === 0) return null;

  return (
    <dl className="shop-info__hours">
      {site.hours.map(({ days, time }) => (
        <div key={`${days}-${time}`} className="shop-info__hours-row">
          <dt className="shop-info__days">{days}</dt>
          <dd>{time}</dd>
        </div>
      ))}
    </dl>
  );
}
```

This is a straight split of the original's logic — every conditional and
every class name is unchanged, just regrouped into three functions instead
of one. `grep -rn "ShopInfo" src` confirmed there is exactly one caller
(`site-footer.tsx`, which you're about to rewrite in Step 2), so there is
no other call site to update.

**Verify:**

```bash
grep -rn "ShopInfo\b" src --include="*.tsx"
```

Expect no matches outside `shop-info.tsx` itself after Step 2 is also done
(the old combined name is gone). It's fine if this still shows the old name
until you finish Step 2.

### Step 2 — Rewrite the footer around four labeled columns

Replace the full contents of `src/components/site-footer.tsx` with:

```tsx
import { NavLink } from "@/components/nav-link";
import { navLinks } from "@/components/site-header";
import { ShopAddress, ShopContact, ShopHours } from "@/components/shop-info";
import { ButtonLink } from "@/components/ui/button";
import { getSite } from "@/lib/content";
import { siteName } from "@/lib/site";

export async function SiteFooter() {
  const site = await getSite();

  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <p className="site-footer__name">{siteName}</p>
      </div>
      <div className="site-footer__grid">
        <div className="site-footer__col">
          <h2 className="eyebrow">Find the shop</h2>
          <ShopAddress site={site} />
        </div>
        <div className="site-footer__col">
          <h2 className="eyebrow">Come on by</h2>
          <ShopHours site={site} />
          {site.walkInNote && (
            <p className="site-footer__note">{site.walkInNote}</p>
          )}
        </div>
        <div className="site-footer__col">
          <h2 className="eyebrow">Get in touch</h2>
          <ShopContact site={site} />
          <ButtonLink href="/contact" className="site-footer__cta">
            Request an appointment
          </ButtonLink>
        </div>
        <nav aria-label="Footer" className="site-footer__col">
          <h2 className="eyebrow">Take a look around</h2>
          <div className="site-footer__nav">
            {navLinks.map(({ href, label }) => (
              <NavLink
                key={href}
                href={href}
                className="site-footer__nav-link"
              >
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
      <p className="site-footer__copyright">
        © {new Date().getFullYear()} {siteName}
      </p>
    </footer>
  );
}
```

Notes:
- Each column renders unconditionally (the `<h2>` label always shows), but
  the content under it (`ShopAddress`/`ShopHours`/`ShopContact`) still
  renders nothing when empty, exactly as before. A heading with no content
  under it is a pre-existing acceptable state in this codebase (e.g. the
  Aftercare and FAQ pages already show a message instead of a heading when
  truly empty) — this plan doesn't need to add empty-state handling beyond
  what already exists, since Shop Info is a singleton the owner has already
  filled in. If you want to double-check, that's a judgment call you can
  make, but don't over-engineer a conditional heading for a scenario this
  codebase doesn't otherwise guard against.
- The `ButtonLink` keeps its existing component and behavior (plan 020's
  real button), just a new `className="site-footer__cta"` for its position
  in the grid instead of the old wrapping `<div className="site-footer__cta">`.

**Verify:**

```bash
pnpm exec tsc --noEmit
```

### Step 3 — Replace the footer and shop-info CSS

In `src/styles/components.css`, replace the entire block from
`.site-footer {` through the `.shop-info__days {` rule (i.e. everything
shown in "Current state" above between those two rules, inclusive) with:

```css
  .site-footer {
    @apply mt-auto border-t border-line bg-surface-sunken;
  }

  .site-footer__top {
    @apply mx-auto max-w-6xl px-fluid-sm pt-fluid-lg;
  }

  .site-footer__name {
    @apply font-medium text-foreground;
  }

  .site-footer__grid {
    @apply mx-auto grid max-w-6xl gap-fluid-lg px-fluid-sm pt-fluid-md text-sm text-muted md:grid-cols-4;
  }

  .site-footer__col {
    @apply grid content-start gap-fluid-sm;
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

  .site-footer__note {
    @apply text-xs;
  }

  .site-footer__cta {
    @apply justify-self-start;
  }

  .site-footer__copyright {
    @apply mx-auto max-w-6xl px-fluid-sm py-fluid-sm text-sm text-muted;
  }

  /* Shop address and contact details: each an <address> block, used inside
     a footer column alongside its own <h2>. */
  .shop-info__contact {
    @apply grid justify-items-start gap-fluid-2xs not-italic;
  }

  .shop-info__link {
    @apply inline-flex min-h-11 items-center;
  }

  .shop-info__hours {
    @apply grid gap-1;
  }

  .shop-info__hours-row {
    @apply flex gap-2;
  }

  .shop-info__days {
    @apply font-medium text-foreground;
  }
```

Note what's gone: `.site-footer__inner`, `.site-footer__brand`, and
`.shop-info` (the old 2-column wrapper) are removed because the new markup
doesn't use them — `site-footer__top` and `site-footer__grid` replace
`site-footer__inner`'s job, and each `ShopAddress`/`ShopHours`/`ShopContact`
renders directly inside a `.site-footer__col` now instead of inside a
`.shop-info` wrapper.

**Verify:**

```bash
pnpm format:check
pnpm lint
```

### Step 4 — Confirm existing tests still pass, add column coverage

Run the existing address test first, unmodified:

```bash
node scripts/fixtures.mjs seed
pnpm test --grep "the footer shows the address"
```

It should still pass — `ShopAddress` renders the same street/cityLine
markup as before, just without the hours block alongside it.

Then add a new test in `tests/site.spec.ts`, near the existing footer test:

```ts
test("the footer groups shop details under labeled columns", async ({
  page,
}) => {
  await open(page, "/");
  const footer = page.getByRole("contentinfo");
  await expect(
    footer.getByRole("heading", { name: "Find the shop" }),
  ).toBeVisible();
  await expect(
    footer.getByRole("heading", { name: "Come on by" }),
  ).toBeVisible();
  await expect(
    footer.getByRole("heading", { name: "Get in touch" }),
  ).toBeVisible();
  await expect(
    footer.getByRole("heading", { name: "Take a look around" }),
  ).toBeVisible();
  await expect(
    footer.getByRole("link", { name: "Request an appointment" }),
  ).toHaveAttribute("href", "/contact");
});
```

**Verify:**

```bash
pnpm test --grep "footer"
node scripts/fixtures.mjs clean
```

### Step 5 — Full verification pass

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm format:check
pnpm test
```

All must exit 0. The full suite's axe sweep runs on every route — the
footer renders on every page via `SiteShell`, so a heading-order or
contrast problem introduced here would show up across every route, not
just one test.

### Step 6 — Manual visual check

```bash
node scripts/fixtures.mjs seed
node_modules/.bin/next dev --port <pick-an-unused-port>
```

Visit `/` in a browser (scroll to the footer). Confirm, in both themes:
- Four labeled columns render: Find the shop, Come on by, Get in touch,
  Take a look around.
- The "Request an appointment" button still looks and behaves like a real
  button (not a plain text link).
- At phone width, the columns stack sensibly (the grid's `md:grid-cols-4`
  should collapse to one column below `md` — confirm it does; if it looks
  cramped at exactly `md`, you may need `sm:grid-cols-2 md:grid-cols-4`
  instead, but try the plan's class first and only change it if the visual
  check shows a real problem).

Then stop the dev server and clean fixtures:

```bash
node scripts/fixtures.mjs clean
```

## Test plan

- Existing, must still pass unmodified: `tests/site.spec.ts`'s
  "the footer shows the address" test.
- Existing, must still pass unmodified: `tests/interactions.spec.ts`'s
  "offers a match-me CTA and a traveling-tattooer contact" test (scoped to
  `main`, unaffected by the footer).
- New: `tests/site.spec.ts` — all four column headings visible, CTA link
  still points at `/contact` (Step 4).
- Full `pnpm test` a11y sweep across every route (the footer is global).

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0 (no new errors)
- [ ] `pnpm lint` and `pnpm format:check` exit 0
- [ ] `pnpm test` exits 0, including the existing address test and the new
      column-headings test
- [ ] `grep -rn "ShopInfo\b" src --include="*.tsx"` returns nothing (the
      old combined name is fully retired)
- [ ] Visiting `/` in `pnpm dev` shows four labeled footer columns and a
      real button for "Request an appointment," confirmed visually in both
      themes and at phone width
- [ ] No files outside the in-scope list modified
- [ ] `plans/README.md` status row updated for plan 023

## STOP conditions

- If any other file besides `site-footer.tsx` turns out to import
  `ShopInfo` (re-check with `grep -rn "ShopInfo" src` yourself — don't
  trust this plan's recon if the codebase has changed since
  `581fd6b`), STOP and report instead of updating that caller yourself —
  the plan's blast-radius assumption would be wrong.
- If the heading-order axe check flags the new footer `<h2>`s on any page
  (e.g. because that page's own content ends on an `h1` with no `h2`/`h3`
  used at all, and something about the jump reads as a skip), STOP and
  report the exact violation and the page it's on — do not silently change
  the heading level to `h3` or lower without review, since that changes
  the document outline this plan explicitly chose.
- If `site.walkInNote` rendering in the "Come on by" column duplicates text
  already shown elsewhere on the homepage in a way that reads as redundant
  rather than reinforcing, that's a legitimate content judgment call — flag
  it in your report rather than silently dropping the line.

## Maintenance notes

- `ShopAddress`, `ShopHours`, and `ShopContact` are now independent and
  could be reused elsewhere (e.g. a future `/contact` page redesign) without
  pulling in the other two — that composability is a side benefit of this
  split, not something this plan asks you to act on.
- If plan 022 (header topbar) hasn't landed yet when you execute this plan,
  there is no interaction between the two — they touch different
  components and different CSS rules. Land them in either order.
