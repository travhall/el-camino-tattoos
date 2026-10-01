# Plan 028: One page-container primitive, sized like the mock

**Planned at:** commit `ddc0f17`, 2026-10-01

**Executor preamble:** Read this entire plan before touching anything. Run
the drift check first. If it reports any difference, STOP and report back.

**Drift check:**

```bash
git diff --stat ddc0f17..HEAD -- src/styles/layout.css src/styles/components.css src/components/site-shell.tsx
```

Expected output: nothing.

## Status

TODO

## Why this matters

The mock constrains every section (topbar, header, hero, bands, footer) to one
container, defined once in
`/Users/travishall/Projects/El Caminio Tattoo/el-camino-tattoo-website-design-DARK/src/index.css`:

```css
.container {
  width: calc(100% - 112px);
  max-width: 1280px;
  margin-inline: auto;
}
/* max-width 1200px: width: calc(100% - 80px)
   max-width  760px: width: calc(100% - 44px) */
```

So: content is up to **1280px** wide, with side gutters of **56px** (wide),
**40px** (<=1200px viewport) and **22px** (<=760px viewport).

The project has no shared container. `max-w-6xl` (1152px, and that includes
the padding) is repeated in six rules, each adding its own `px-fluid-sm`
(16-18px): `.page`, `.site-header__inner`, `.site-topbar__inner`,
`.site-footer__top`, `.site-footer__grid`, `.site-footer__copyright`. At a
1440px viewport the project's content is ~1116px wide with 162px of dead
margin each side; the mock's is 1280px with 80px each side. That is the
biggest reason the project feels narrower and tighter than the mock, and
plans 029-031 (header, hero, footer) all assume the wider container.

This plan introduces one container definition and points all six rules at it.
No visual change other than width and gutters.

The gutters are the mock's numbers on purpose (a design decision the owner
asked to match), so they are rem constants in one place rather than on the
fluid spacing scale.

## Current state

`src/styles/layout.css`, lines 22-24:

```css
.page {
  @apply mx-auto w-full max-w-6xl flex-1 px-fluid-sm py-fluid-xl;
}
```

`src/styles/components.css`:

```css
.site-header__inner {
  @apply mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-fluid-md gap-y-fluid-xs px-fluid-sm py-fluid-sm;
}
.site-topbar__inner {
  @apply mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-fluid-md gap-y-fluid-3xs px-fluid-sm py-fluid-2xs;
}
.site-footer__top {
  @apply mx-auto max-w-6xl px-fluid-sm pt-fluid-lg;
}
.site-footer__grid {
  @apply mx-auto grid max-w-6xl gap-fluid-lg px-fluid-sm pt-fluid-md text-sm text-muted md:grid-cols-4;
}
.site-footer__copyright {
  @apply mx-auto max-w-6xl px-fluid-sm py-fluid-sm text-sm text-muted;
}
```

Confirm with `grep -rn "max-w-6xl" src`: expect exactly those six lines.

Conventions: CSS lives in `@layer components`, BEM class names, Tailwind via
`@apply`, no inline utilities in JSX (`CLAUDE.md` "Styling conventions").
`@apply` doesn't work with plain custom classes in Tailwind v4, so the shared
width is a CSS custom property, not a class.

## Commands you will need

| Purpose       | Command                                                    | Expected                       |
| ------------- | ---------------------------------------------------------- | ------------------------------ |
| Static checks | `pnpm exec tsc --noEmit && pnpm lint && pnpm format:check` | exit 0                         |
| Full suite    | `pnpm test`                                                | all pass (87 before this plan) |

## Scope

**In scope:** `src/styles/layout.css`, `src/styles/components.css`,
`tests/site.spec.ts` (one new test).

**Out of scope, do not touch:** any `.tsx` file; `.stack`, `.cluster`,
`.section-header`; heights, typography or visual styling in the six rules
beyond width and horizontal padding (header/topbar heights are plan 029,
footer proportions plan 031); `src/styles/styleguide.css`.

## Steps

### Step 1 — Define the container variables

In `src/styles/layout.css`, inside `@layer components { ... }`, immediately
above `.page`, add (match the file's comment style):

```css
/* The one page container, sized to match the design mock: content up to
     80rem (1280px), with 22/40/56px side gutters at phone/tablet/desktop.
     Every full-width section (topbar, header, main, footer) uses
     width: var(--page-width) with margin-inline: auto. The % in
     --page-width resolves on the element that uses it. */
:root {
  --page-max: 80rem;
  --page-gutter: 1.375rem;
  --page-width: min(100% - 2 * var(--page-gutter), var(--page-max));
}

@media (min-width: 48rem) {
  :root {
    --page-gutter: 2.5rem;
  }
}

@media (min-width: 75rem) {
  :root {
    --page-gutter: 3.5rem;
  }
}
```

### Step 2 — Point the six rules at it

In each of the six rules remove `max-w-6xl` and `px-fluid-sm`, and add
`w-(--page-width)`. Keep `mx-auto` and every other utility unchanged.
Results:

- `.page`: `@apply mx-auto w-(--page-width) flex-1 py-fluid-xl;` (drops `w-full max-w-6xl px-fluid-sm`)
- `.site-header__inner`: `@apply mx-auto flex w-(--page-width) flex-wrap items-center justify-between gap-x-fluid-md gap-y-fluid-xs py-fluid-sm;`
- `.site-topbar__inner`: `@apply mx-auto flex w-(--page-width) flex-wrap items-center justify-between gap-x-fluid-md gap-y-fluid-3xs py-fluid-2xs;`
- `.site-footer__top`: `@apply mx-auto w-(--page-width) pt-fluid-lg;`
- `.site-footer__grid`: `@apply mx-auto grid w-(--page-width) gap-fluid-lg pt-fluid-md text-sm text-muted md:grid-cols-4;`
- `.site-footer__copyright`: `@apply mx-auto w-(--page-width) py-fluid-sm text-sm text-muted;`

**Verify:** `grep -rn "max-w-6xl" src` returns nothing; then
`pnpm exec tsc --noEmit && pnpm lint && pnpm format:check`.

### Step 3 — Add a test

In `tests/site.spec.ts`, add to the first `describe` block (pattern: "the
footer shows the address", which uses the file's `open()` helper):

```ts
test("page sections share one container: 1280px wide at a 1440px viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/");
  for (const selector of [
    ".site-topbar__inner",
    ".site-header__inner",
    "main",
    ".site-footer__grid",
  ]) {
    const box = await page.locator(selector).first().boundingBox();
    expect(box?.width, selector).toBe(1280);
    expect(box?.x, selector).toBe(80);
  }
});
```

`.site-topbar__inner` renders only when shop info has a walk-in note or city;
`content/site.yaml` has both. If a selector finds nothing, STOP and report.

**Verify:** `pnpm test` exits 0. Also view `/` at 1440, 768 and 375 wide in
`pnpm dev`: no horizontal scrollbar; header, main and footer edges line up.

## Test plan

The one new test, plus the existing a11y sweep (all routes, phone and
desktop) and the phone touch-target tests, which exercise the new gutters.

## Done criteria

- [ ] `grep -rn "max-w-6xl" src` returns nothing
- [ ] Container variables defined once, in `layout.css`
- [ ] New test passes; `pnpm test` exits 0
- [ ] `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm format:check` exit 0
- [ ] No horizontal overflow at 375, 768, 1440 wide
- [ ] Only `layout.css`, `components.css`, `tests/site.spec.ts` modified
- [ ] `plans/README.md` row 028 updated

## STOP conditions

- `grep` shows a `max-w-6xl` rule not listed here.
- `w-(--page-width)` doesn't generate a width. Report; don't hand-write a
  fallback in markup.
- An existing test fails on layout widths this plan didn't cause.

## Maintenance notes

- Plans 029-031 rely on this container. Land this first.
- The mock's breakpoints are 760px and 1200px; this uses 768px (Tailwind
  `md`) and 1200px, to line up with the project's other `md:` utilities.
- New full-width sections should reuse `mx-auto w-(--page-width)`.
