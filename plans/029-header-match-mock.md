# Plan 029: Header and topbar closer to the mock

**Planned at:** commit `ddc0f17`, 2026-10-01

**Executor preamble:** Read this entire plan before touching anything. Run
the drift check first. If it reports any difference, STOP and report back.

**Drift check:**

```bash
git diff --stat ddc0f17..HEAD -- src/components/site-header.tsx src/components/theme-toggle.tsx src/styles/components.css src/styles/layout.css tests/interactions.spec.ts
```

Expected output: nothing, **except** `components.css` and `layout.css` may
show plan 028's changes (container variables, `w-(--page-width)`), which this
plan requires. Plan 028 must already be merged; if
`grep -n "page-width" src/styles/layout.css` finds nothing, STOP.

## Status

TODO

## Why this matters

Plan 022 added a topbar and plan 020 a header CTA, but the result "fell a bit
short" of the reviewed mock (owner's words). Measured at a 1440px viewport:

| Part              | Mock                                    | Project today                  |
| ----------------- | --------------------------------------- | ------------------------------ |
| Topbar height     | 36px                                    | **63px**                       |
| Header row height | 98px (85px <=1000, 78px <=760)          | 80px                           |
| Header behavior   | sticky; topbar scrolls away             | not sticky                     |
| Topbar text       | 12px uppercase, letterspaced, star icon | 14-16px sentence case, no icon |
| Theme toggle      | pill: icon + visible label              | 44x44 box, icon only           |
| Nav links         | 15px uppercase, letterspaced            | sentence case                  |

The topbar is 63px because `.site-topbar__walkin` is `min-h-11` (44px) inside
`py-fluid-2xs` padding, so a one-line strip is taller than the header's logo.
The 44px target size is a project rule (`CLAUDE.md`) and its test only runs
on a phone viewport (`tests/interactions.spec.ts`, "touch targets on a
phone", 375px). So: keep 44px on phones, drop to the mock's 36px strip from
`md` up.

Reference mock source (read-only):
`/Users/travishall/Projects/El Caminio Tattoo/el-camino-tattoo-website-design-DARK/src/index.css`
(`.topbar*`, `.site-header`, `.header-inner`, `.nav-link`, `.theme-toggle`) and
`src/components.tsx` (`Header`).

Owner decisions that bound this plan: **gold, not the mock's red** (the nav
current marker stays the existing gold `nav-current` underline); **keep Being
and Hanken Grotesk** (no font change; the mock's Barlow Condensed look is
approximated with uppercase + tracking only); the SVG `SiteLogo` stays (the
mock's text wordmark is not ported).

## Current state

`src/components/site-header.tsx` renders:

```tsx
<header className="site-header">
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
  <div className="site-header__inner">
    <Link href="/" className="site-header__brand">
      <SiteLogo className="site-header__logo" />
      <span className="visually-hidden">El Camino Tattoos</span>
    </Link>
    <nav aria-label="Primary" className="site-nav">
      {" "}
      ... NavLink x5 ... <ButtonLink href="/contact">Request</ButtonLink>
    </nav>
  </div>
</header>
```

`src/styles/components.css` (after plan 028; widths as in 028):

```css
.site-header {
  @apply border-b border-line;
}
.site-topbar {
  @apply border-b border-line bg-surface-sunken text-sm text-subtle;
}
.site-topbar__inner {
  @apply mx-auto flex w-(--page-width) flex-wrap items-center justify-between gap-x-fluid-md gap-y-fluid-3xs py-fluid-2xs;
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
.site-nav {
  @apply flex flex-wrap items-center gap-x-fluid-md gap-y-fluid-3xs;
}
.site-nav__link {
  @apply inline-flex min-h-11 items-center hover:underline;
}
.site-nav__link[aria-current] {
  @apply underline decoration-nav-current decoration-2 underline-offset-8;
}
.theme-toggle {
  @apply inline-flex min-h-11 min-w-11 items-center justify-center rounded-none border border-outline bg-transparent text-foreground transition-colors hover:bg-hover motion-reduce:transition-none;
}
.theme-toggle__icon {
  @apply text-base leading-none;
}
```

`src/components/theme-toggle.tsx`: a client component; the button renders
`<span aria-hidden className="theme-toggle__icon">{icons[theme]}</span>` and
has `aria-label={labels[theme]}` with labels `"Use light theme"` /
`"Use dark theme"`, icons `☀`/`☾`. It is also rendered in the header nav when
there is no topbar (`{!(site.walkInNote || cityLine) && <ThemeToggle />}`).

Conventions: semantic BEM classes in `components.css`, `@apply` for
utilities, no inline utilities in JSX, roles not colors, motion via
`--duration-*` and `--ease-out`. See `.button--sm` in `components.css` for
how a compact variant is written.

## Commands you will need

| Purpose       | Command                                                    | Expected                   |
| ------------- | ---------------------------------------------------------- | -------------------------- |
| Static checks | `pnpm exec tsc --noEmit && pnpm lint && pnpm format:check` | exit 0                     |
| Full suite    | `pnpm test`                                                | all pass                   |
| Dev           | `pnpm dev` (port 3000)                                     | view `/` at 1440, 768, 375 |

## Scope

**In scope:** `src/components/site-header.tsx`,
`src/components/theme-toggle.tsx`, new `src/components/flash-star.tsx`,
`src/styles/components.css`, `src/styles/layout.css` (scroll offset only),
`tests/interactions.spec.ts` (extend, don't weaken).

**Out of scope, do not touch:**

- A hamburger/disclosure mobile menu. The mock has one at <=1000px; the owner
  has said phone navigation will be a bottom dock designed later. The nav
  keeps wrapping as it does now.
- The `navLinks` array, link order and labels (the footer imports it).
- Fonts, `SiteLogo`, the Request button's variant (stays the existing ink
  primary; the mock's red CTA is intentionally not ported).
- Light-theme values, `roles.css`, the footer.

## Steps

### Step 1 — Compact topbar (36px desktop, 44px targets on phone)

In `components.css`:

- `.site-topbar`: add `text-xs uppercase tracking-widest` (replaces `text-sm`; keep `border-b border-line bg-surface-sunken text-subtle`).
- `.site-topbar__inner`: replace `py-fluid-2xs` with `py-0 md:min-h-9` (no vertical padding; the strip's height comes from its tallest control).
- `.site-topbar__walkin`: `inline-flex min-h-11 items-center gap-2 hover:underline md:min-h-9`.
- `.theme-toggle`: add `md:min-h-9` (keep `min-h-11 min-w-11` for phones). It's used elsewhere, so this is a pure desktop shrink; confirm in `/styleguide` it still looks right.

Add a decorative star before the walk-in text. Create
`src/components/flash-star.tsx` exporting `FlashStar({ className })`, an inline
SVG with `fill="currentColor"`, `aria-hidden="true"`, `focusable="false"`,
`viewBox="0 0 60 60"` and this path (the mock's star, from its `Icons.tsx`),
`fillRule="evenodd"` `clipRule="evenodd"`:

```
m30 2 5 18 15-10-10 15 18 5-18 5 10 15-15-10-5 18-5-18-15 10 10-15-18-5 18-5-10-15 15 10ZM30 24a6 6 0 1 0 0 12 6 6 0 1 0 0-12Z
```

Match `site-logo.tsx`'s style (props `{ className?: string }`, a comment saying
it is decorative). Render it inside the walk-in `<Link>` before the text with
class `site-topbar__star` = `@apply size-4 shrink-0 text-accent-mark;` in
`components.css`.

**Verify:** at 1440 wide the topbar is 36px tall
(`document.querySelector('.site-topbar').getBoundingClientRect().height`);
at 375 wide it is >=44px; the phone touch-target test for `/` passes.

### Step 2 — Theme toggle with a visible label

In `theme-toggle.tsx`, show a text label beside the icon so the control reads
like the mock's pill. To satisfy WCAG 2.5.3 (label in name) the accessible
name must contain the visible text:

- Visible text in `<span className="theme-toggle__label">`: `"Paper mode"` when the current theme is dark (it switches to light), `"Dark mode"` when light.
- `aria-label` becomes `"Switch to paper mode"` / `"Switch to dark mode"`. Update the `labels` map.
- Hide the visible label on phones: `.theme-toggle__label { @apply hidden md:inline; }`; add `md:gap-2 md:px-3` to `.theme-toggle`. On phones the button is icon-only with the same accessible name.

Before editing: `grep -rn "Use light theme\|Use dark theme" src tests`; update
every hit. If a hit is in a file outside this plan's Scope, STOP and report.

**Verify:** toggling by keyboard (Tab to it, Enter) still works; the topbar
test ("persists through theme toggle") passes.

### Step 3 — Header row height and nav style

In `components.css`:

- `.site-header__inner`: replace `py-fluid-sm` with `min-h-20 py-0 md:min-h-[5.3rem] xl:min-h-[6.125rem]` (80 / ~85 / 98px; the mock's 78/85/98).
- `.site-nav__link`: add `text-sm font-medium uppercase tracking-wide`.
- Leave `.site-nav__link[aria-current]` as is (gold underline).

**Verify:** at 1440 wide the header row is 98px; nav labels render
uppercase (CSS only, so link-name tests are unaffected).

### Step 4 — Sticky header; the topbar scrolls away

The mock's header row sticks while the topbar scrolls off. The topbar lives
inside `<header>` (plan 022 moved it there to satisfy axe's `region` rule), so
stick the whole `<header>` with a negative `top` equal to the topbar height:

```css
.site-header {
  @apply sticky top-0 z-40 border-b border-line bg-background;
  --topbar-height: 2.75rem;
}
@media (min-width: 48rem) {
  .site-header {
    --topbar-height: 2.25rem;
  }
}
.site-header:has(.site-topbar) {
  top: calc(-1 * var(--topbar-height));
}
.site-topbar {
  height: var(--topbar-height);
}
```

Merge these into the existing `.site-header` / `.site-topbar` rules rather
than duplicating selectors. Anchored links (`/faq#...`) would land under the
sticky row, so in `layout.css` add inside `@layer components`, beside `.page`:

```css
html {
  scroll-padding-top: 7rem;
}
```

**Verify:** scroll `/faq` ~300px: the topbar is gone and the nav row is
pinned at y=0; following a `/faq#...` anchor puts the target below the
header. With empty site fields (no topbar) the header pins at y=0 with no gap
(the `:has` rule gates the offset).

### Step 5 — Test

In `tests/interactions.spec.ts`, near "the topbar shows the walk-in note..."
(~line 491), add (pattern: that test, and `open()`):

```ts
test("header: compact topbar and a sticky nav row on desktop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/");
  const topbar = await page.locator(".site-topbar").boundingBox();
  expect(topbar?.height).toBe(36);
  await page.evaluate(() => window.scrollTo(0, 600));
  const row = await page.locator(".site-header__inner").boundingBox();
  expect(row?.y).toBe(0);
});
```

If the page isn't tall enough to scroll 600px with fixture content, scroll to
`document.body.scrollHeight` instead; do not loosen the expected numbers
without reporting why.

## Test plan

The new test above; existing: topbar walk-in test, theme-toggle tests, phone
touch-target tests, the full a11y sweep. The toggle rename must leave all of
them green.

## Done criteria

- [ ] Topbar 36px at >=768 wide; controls >=44px at 375 wide
- [ ] Header row 98px at 1440 wide; nav labels uppercase
- [ ] Header sticks, topbar scrolls off, anchors clear it
- [ ] Toggle has a visible label on desktop; accessible name contains it
- [ ] `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm format:check`, `pnpm test` exit 0
- [ ] No files outside Scope modified; `plans/README.md` row 029 updated

## STOP conditions

- Plan 028 not merged (see drift check).
- axe reports a new violation (`region`, `color-contrast`, `label-content-name-mismatch`) in any sweep combination. Report with the node; don't disable the rule.
- `position: sticky` doesn't pin because an ancestor sets `overflow` (check `.site-frame`); report instead of changing the shell.
- The `:has()` offset behaves inconsistently in the Playwright browser.

## Maintenance notes

- If the owner later adopts Barlow Condensed (README, "not planned"), drop
  `tracking-widest` here and let the font carry the look.
- When the phone bottom dock is designed, `.site-nav` wrapping on phones goes
  away; the sticky rules here are unaffected.
- `--topbar-height` is duplicated knowledge (CSS sets the strip's height from
  it). Anything that makes the topbar taller must change that variable.
