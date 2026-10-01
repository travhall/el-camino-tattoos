# Plan 030: Homepage hero closer to the mock (editable copy, sizing, promises strip)

**Planned at:** commit `ddc0f17`, 2026-10-01

**Executor preamble:** Read this entire plan before touching anything. Run
the drift check first. If it reports any difference, STOP and report back.

**Drift check:**

```bash
git diff --stat ddc0f17..HEAD -- "src/app/(site)/page.tsx" src/components/hero-photo.tsx src/components/shop-notes.tsx src/lib/content.ts keystatic.config.ts content/site.yaml src/styles/roles.css tests/site.spec.ts
```

Expected output: nothing, except `keystatic.config.ts` may show plan 024's
Netlify guard (already merged at `3000314`; fine). `src/styles/components.css`
may show plans 028/029; expected. Plans 028 and 029 must be merged first (028
gives the container, 029 gives `src/components/flash-star.tsx`). If
`ls src/components/flash-star.tsx` fails or
`grep -n "page-width" src/styles/layout.css` finds nothing, STOP.

## Status

TODO

## Why this matters

The mock's hero (`.../el-camino-tattoo-website-design-DARK/src/pages/Home.tsx`,
and `.hero*`, `.walkin-stamp`, `.paper-tape`, `.shop-promises` in
`src/index.css`) is the shop's front door: a short italic kicker, a two-line
headline, a hand-drawn underline, a description, one CTA and a small
reassurance line on the left; a framed, slightly rotated photo with a caption
bar and a stamp on the right; and, below, a strip of three promises. The
project's hero today is an `h1` "El Camino Tattoos" at 134px (`.display`,
`text-6xl`; the mock's headline is 65px), one line of notes, and a portrait
photo (4:5) with a small stamp. Plan 017 added the photo frame and stamp; this
plan brings sizing, copy and structure to the mock.

Owner decisions that bound this plan:

- **Hero copy is editable in Keystatic** (new optional Shop info fields), not hard-coded, with fallbacks so an empty site still renders.
- **Gold, not red** for marks (underline, stamp, stars use the existing `accent-mark` role).
- **Keep Being + Hanken Grotesk.** The mock's Alfa Slab One headline is not ported, so headline size is chosen to fit this project's display font (Step 3).
- **Sharp corners stay** (plan 015): the stamp stays square, not the mock's circle.
- Not ported: the mock's "swallow" flash illustration (needs a transparent-PNG asset; the mock makes its dark version with a runtime canvas hack that must not be copied). See Maintenance notes.

## Current state

`src/app/(site)/page.tsx`, the hero part:

```tsx
    <div className="stack stack--xl">
      <div className="home-hero">
        <div className="home-hero__intro stack">
          <h1 className="display">El Camino Tattoos</h1>
          <ShopNotes site={site} />
        </div>
        <HeroPhoto piece={heroPiece} artistName={heroArtistName} walkIns={site.walkIns} />
      </div>
      <section aria-labelledby="artists-heading" className="stack stack--lg"> ...
```

`src/components/shop-notes.tsx`:

```tsx
export function ShopNotes({ site }: { site: Site }) {
  const notes = [
    site.walkIns ? site.walkInNote || "Walk-ins welcome." : "",
    site.consultationNote,
  ].filter(Boolean);
  if (notes.length === 0) return null;
  return <p className="lead measure">{notes.join(" ")}</p>;
}
```

(`ShopNotes` is also used on the contact page; see
`grep -rn "ShopNotes" src`.)

`src/components/hero-photo.tsx` renders `.home-hero__photo > .photo-frame >
.photo-frame__media (Image fill, priority) + .photo-frame__tape`, then, only
when `walkIns`, an `aria-hidden` `.stamp` with two lines "Walk-ins" /
"Welcome".

`src/styles/components.css` (end of file):

```css
.home-hero {
  @apply grid items-center gap-fluid-lg md:grid-cols-2;
}
.home-hero__photo {
  @apply relative;
}
.photo-frame {
  @apply relative border border-line bg-surface p-fluid-2xs;
}
.photo-frame__media {
  @apply relative aspect-[4/5] bg-surface-sunken;
}
.photo-frame__tape {
  @apply absolute top-[-0.75rem] left-1/2 h-6 w-16 -translate-x-1/2 -rotate-2 bg-surface-raised/80;
}
.stamp {
  @apply absolute right-[-1rem] bottom-[-1rem] flex aspect-square w-24 -rotate-12 flex-col items-center justify-center gap-0.5 border-2 border-accent-mark text-center text-[10px] leading-tight font-medium tracking-[0.08em] text-accent-mark uppercase;
  box-shadow:
    inset 0 0 0 3px var(--background),
    inset 0 0 0 4px var(--accent-mark);
}
.stamp__line {
  @apply block;
}
```

`keystatic.config.ts`, `site` singleton schema fields in order: `description,
phone, email, street, city, region, postalCode, hours, walkIns, walkInNote,
consultationNote, depositAmount, instagram`. `src/lib/content.ts` has
`export type Site = {...}` and `getSite = cache(async () => { const entry =
await reader.singletons.site.read(); return { description: entry?.description
?? "", ... } })`. `content/site.yaml` is committed placeholder content:

```yaml
description: Traditional tattoos and more in downtown Eau Claire, Wisconsin. ...
street: 310 Water Street
city: Eau Claire
region: WI
postalCode: "54703"
walkIns: true
walkInNote: Walk-ins welcome when available.
consultationNote: Free consultations.
depositAmount: 100
```

Existing tests that must keep passing (`tests/site.spec.ts`): "the homepage
leads with the walk-in and consultation notes" (text `Walk-ins welcome when
available. Free consultations.` visible on `/`) and "the homepage hero shows a
photo with a decorative walk-ins stamp" (`.home-hero__photo` contains an img;
`.stamp` visible with `aria-hidden="true"`).

Conventions: semantic BEM classes + `@apply` in `components.css`; no inline
utilities in JSX; roles only (no hex or ramp steps); one `h1` per page; new UI
goes into `/styleguide` first (`CLAUDE.md`), done in Step 7.

## Commands you will need

| Purpose       | Command                                                    | Expected                          |
| ------------- | ---------------------------------------------------------- | --------------------------------- |
| Static checks | `pnpm exec tsc --noEmit && pnpm lint && pnpm format:check` | exit 0                            |
| Contrast      | `pnpm check:contrast`                                      | exit 0                            |
| Manifest      | `pnpm figma-manifest`                                      | regenerates `figma/manifest.json` |
| Full suite    | `pnpm test`                                                | all pass                          |

## Scope

**In scope:** `keystatic.config.ts` (site singleton fields only),
`src/lib/content.ts` (`Site`, `getSite`), `content/site.yaml`,
`src/app/(site)/page.tsx`, `src/components/hero-photo.tsx`,
`src/components/shop-notes.tsx`, new `src/components/shop-promises.tsx`,
`src/styles/components.css`, `src/styles/roles.css` (one new UI token),
`src/styles/theme.css` only if it maps UI tokens, the styleguide page for the
new pieces, `tests/site.spec.ts`, `figma/manifest.json` (regenerated).

**Out of scope, do not touch:** the Artists/Recent-work sections of the
homepage; the header and footer; the swallow illustration; fonts; any other
`site` field; the contact page (it uses `ShopNotes`, which must render
unchanged there); the Netlify guard at the top of `keystatic.config.ts`.

## Steps

### Step 1 — Add the editable hero fields

In `keystatic.config.ts`, in the `site` singleton schema, add after
`consultationNote` and before `depositAmount` (all optional, no validation):

```ts
        heroKicker: fields.text({
          label: "Hero kicker",
          description: "A short italic line above the headline.",
        }),
        heroHeadline: fields.text({
          label: "Hero headline",
          description:
            "Shown as the page's main heading. Put each line on its own line.",
          multiline: true,
        }),
        heroDescription: fields.text({
          label: "Hero description",
          description: "One or two sentences under the headline.",
          multiline: true,
        }),
        heroPhotoCaption: fields.text({
          label: "Hero photo caption",
          description: "A short line under the hero photo.",
        }),
        shopPromises: fields.array(fields.text({ label: "Promise" }), {
          label: "Shop promises",
          description: "Three short lines shown in a strip under the hero.",
          itemLabel: (props) => props.value || "Promise",
        }),
```

In `src/lib/content.ts` add to `Site`: `heroKicker: string; heroHeadline:
string; heroDescription: string; heroPhotoCaption: string; shopPromises:
readonly string[];` and to `getSite`'s returned object, in that order,
`entry?.heroKicker ?? ""`, `entry?.heroHeadline ?? ""`,
`entry?.heroDescription ?? ""`, `entry?.heroPhotoCaption ?? ""`,
`entry?.shopPromises ?? []`.

Add placeholder content to `content/site.yaml` (keep the comment at the top):

```yaml
heroKicker: A good place to get tattooed.
heroHeadline: |-
  GOOD TATTOOS.
  GOOD PEOPLE.
heroDescription: Classic roots. Original work. A small, welcoming tattoo studio in downtown Eau Claire, making tattoos you'll be proud to wear.
heroPhotoCaption: Tradition at heart. Everyone welcome.
shopPromises:
  - Rooted in American traditional
  - Walk-ins & appointments
  - Free consultations. Always.
```

**Verify:** `pnpm exec tsc --noEmit` exits 0. In `pnpm dev`, `/keystatic` →
Shop info shows the five fields and saves them.

### Step 2 — Hero markup

In `page.tsx`, replace the `home-hero__intro` block with the following, and
pass `caption={site.heroPhotoCaption}` to `HeroPhoto`:

```tsx
<div className="home-hero__intro">
  {site.heroKicker && <p className="home-hero__kicker">{site.heroKicker}</p>}
  <h1 className="home-hero__title">
    {(site.heroHeadline || siteName).split("\n").map((line) => (
      <span key={line} className="home-hero__title-line">
        {line}
      </span>
    ))}
  </h1>
  <svg
    className="home-hero__underline"
    viewBox="0 0 460 12"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M2 7C82 2 178 9 258 5S399 6 456 3M18 10c129-3 280 1 427-2"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
  </svg>
  {site.heroDescription && (
    <p className="home-hero__description">{site.heroDescription}</p>
  )}
  <ButtonLink href="/contact" size="lg" className="home-hero__cta">
    Request an appointment
  </ButtonLink>
  <ShopNotes site={site} className="home-hero__note" />
</div>
```

Import `siteName` from `@/lib/site` and `ButtonLink` from
`@/components/ui/button`. When the headline falls back to `siteName` it is one
line. If kicker and description are empty the hero still renders.

Give `ShopNotes` an optional `className` prop: the default stays
`"lead measure"` (so the contact page is unchanged); when passed, use that
class instead.

**Verify:** `/` shows a two-line h1; `document.querySelectorAll('h1').length`
is 1; the contact page's notes look unchanged.

### Step 3 — Hero styles

In `components.css`, replace `.home-hero` and add (roles only):

```css
.home-hero {
  @apply grid items-center gap-fluid-xl md:grid-cols-[1.04fr_1.12fr];
}
.home-hero__intro {
  @apply grid justify-items-start gap-fluid-sm;
}
.home-hero__kicker {
  @apply text-lg text-muted italic;
}
.home-hero__title {
  @apply font-display text-4xl font-semibold uppercase;
  font-variation-settings: "trap" 1;
}
.home-hero__title-line {
  @apply block whitespace-nowrap;
}
.home-hero__underline {
  @apply -mt-1 h-3 w-[94%] text-accent-mark;
}
.home-hero__description {
  @apply max-w-[28rem] text-base text-muted;
}
.home-hero__cta {
  @apply mt-fluid-2xs;
}
.home-hero__note {
  @apply text-sm text-subtle;
}
```

(The `font-variation-settings` line is copied from `.display` in
`typography.css`, to keep Being's ink-trap cut.)

**Headline size is the one judgement call.** Start at `text-4xl`. The longest
line must fit the left column (about 560px at 1440 wide) with no overflow:
check `.home-hero__title.scrollWidth <= .clientWidth` at 1440, 1024, 768 and 375. If any width overflows, step the size down one (`text-3xl`) rather than
allowing wrapping or horizontal scroll. Report the final size.

**Verify:** no horizontal scrollbar at 375, 768, 1024, 1440; the h1 reads in
two lines at >=768.

### Step 4 — Photo frame, caption and stamp

Add one UI token for the mock's hard offset shadow. In `roles.css`, in the
dark `:root` UI-token block add `--frame-shadow-color: var(--paper-950);`; in
`:root[data-theme="light"]` add `--frame-shadow-color: transparent;`; add a
line for it in the "UI tokens" doc comment at the top of the file
(`frame-shadow-color ... hard offset shadow behind the hero photo frame`).
Reference it with `var()` in the rule below (map it in `theme.css` only if
that file already maps the other UI tokens).

Update `hero-photo.tsx`:

- Accept `caption?: string`. Render, inside `.photo-frame` after the media div, `{caption && <p className="photo-frame__caption"><span>{caption}</span><FlashStar className="photo-frame__star" /></p>}` (import `FlashStar` from `@/components/flash-star`).
- In the stamp, keep "Walk-ins" / "Welcome", then add `<FlashStar className="stamp__star" />` and a `<span className="stamp__small">When available</span>`. It stays `aria-hidden`.
- Change the `Image` `sizes` to `"(min-width: 768px) 46vw, 90vw"`.

CSS in `components.css` (edit the existing `.stamp`, `.photo-frame` and
`.photo-frame__media` rules in place; don't duplicate them):

```css
.photo-frame {
  @apply relative border border-border bg-surface p-2 pb-0 md:rotate-[1.3deg];
  box-shadow: 8px 8px 0 var(--frame-shadow-color);
}
.photo-frame__media {
  @apply relative aspect-[4/3] bg-surface-sunken md:aspect-[5/4];
}
.photo-frame__media img {
  @apply brightness-95 contrast-[1.08] grayscale;
}
.photo-frame__caption {
  @apply flex items-center justify-between gap-fluid-xs px-2 py-fluid-xs text-xs tracking-widest text-muted uppercase;
}
.photo-frame__star {
  @apply size-4 shrink-0 text-accent-mark;
}
/* .stamp: change w-24 -rotate-12 text-[10px] to w-32 rotate-[11deg] text-xs,
     and right/bottom to -1.6rem / 0.75rem; keep border-accent-mark and the
     double-ring box-shadow. */
.stamp__star {
  @apply my-0.5 size-4 text-accent-mark;
}
.stamp__small {
  @apply text-[9px] tracking-widest;
}
```

The grayscale filter is the mock's look but hides tattoo colour: an owner
call, isolated to the one `.photo-frame__media img` rule so it can be
deleted. Say so in your report.

**Verify:** at 1440 the photo is landscape (5:4), tilted ~1.3deg, with a hard
shadow in dark and none in light; the stamp overlaps the bottom-right corner
with no horizontal scroll at 375 or 1440.

### Step 5 — Promises strip

Create `src/components/shop-promises.tsx`:

```tsx
import { FlashStar } from "@/components/flash-star";

/** The shop's short promises, separated by stars. Renders nothing if there are none. */
export function ShopPromises({ promises }: { promises: readonly string[] }) {
  if (promises.length === 0) return null;
  return (
    <ul className="shop-promises" aria-label="What to expect">
      {promises.map((promise, index) => (
        <li key={promise} className="shop-promises__item">
          {index > 0 && <FlashStar className="shop-promises__star" />}
          <span>{promise}</span>
        </li>
      ))}
    </ul>
  );
}
```

Render `<ShopPromises promises={site.shopPromises} />` in `page.tsx` directly
after the `home-hero` div (inside the outer `stack`). CSS:

```css
.shop-promises {
  @apply flex flex-wrap items-center justify-between gap-x-fluid-md gap-y-fluid-2xs border-y border-border py-fluid-sm text-lg tracking-wide uppercase;
}
.shop-promises__item {
  @apply flex items-center gap-fluid-md;
}
.shop-promises__star {
  @apply size-5 shrink-0 text-accent-mark;
}
```

(`FlashStar` is `aria-hidden`, so a screen reader hears three list items.)

**Verify:** at 375 the strip wraps without overflow; at 1440 the three items
spread across the container.

### Step 6 — Test

In `tests/site.spec.ts`, in the first `describe`, next to the hero stamp test
(pattern: that test and `open()`):

```ts
test("the hero shows the editable headline, description and promises strip", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /GOOD TATTOOS\.\s*GOOD PEOPLE\./,
  );
  await expect(page.getByText("Classic roots. Original work.")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Request an appointment" }).first(),
  ).toHaveAttribute("href", "/contact");
  const promises = page
    .getByRole("list", { name: "What to expect" })
    .getByRole("listitem");
  await expect(promises).toHaveCount(3);
  const title = page.locator(".home-hero__title");
  expect(await title.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    false,
  );
});
```

If `getByRole("heading", { level: 1 })` is ambiguous on `/`, STOP and report.

### Step 7 — Styleguide, manifest, verification

Add the kicker/headline/underline sample, the framed photo with caption, and
the promises strip to `/styleguide`; follow how existing component samples are
laid out under `src/app/styleguide/` (use `src/styles/styleguide.css` only if
needed). Then:

```bash
pnpm figma-manifest
pnpm check:contrast
pnpm exec tsc --noEmit && pnpm lint && pnpm format:check
pnpm test
```

All exit 0.

## Test plan

The new hero test; existing site tests for the notes and stamp; the a11y sweep
for `/` (light and dark, phone and desktop; new elements are a heading, a list
and decorative SVGs); the phone touch-target test for `/` (the CTA is
`size="lg"`, so at least 48px tall).

## Done criteria

- [ ] Five new optional Keystatic fields; `Site`/`getSite` updated; placeholder copy in `content/site.yaml`
- [ ] `/` renders kicker, two-line headline, underline, description, CTA, notes line, framed photo with caption, stamp, promises strip
- [ ] Exactly one `h1`; falls back to "El Camino Tattoos" when the field is empty
- [ ] No horizontal overflow at 375, 768, 1024, 1440
- [ ] `ShopNotes` unchanged on `/contact`
- [ ] `/styleguide` shows the new pieces; manifest regenerated
- [ ] `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm format:check`, `pnpm check:contrast`, `pnpm test` exit 0
- [ ] `plans/README.md` row 030 updated

## STOP conditions

- Plans 028/029 not merged (drift check).
- Fitting the longest headline line needs a size below `text-3xl`: report the measured widths instead of shrinking further.
- axe fails (`color-contrast` for `text-subtle` or `text-muted` on the dark surface, `heading-order`, `list`) in any combination.
- `fields.array(fields.text(...))` doesn't type-check on the installed Keystatic version.
- A test other than those named depends on the old hero markup (the `h1` text "El Camino Tattoos", or the `lead` class on the homepage).

## Maintenance notes

- The mock's swallow flash illustration (a transparent PNG floating over the headline, top right) is deliberately absent. If the owner supplies a transparent asset, add it as a decorative `next/image` (`alt=""`, `aria-hidden`) positioned absolutely in `.home-hero__intro`; do not port the mock's runtime canvas background removal.
- `heroHeadline` is split on newlines; one long line gets one long nowrap line that can overflow on phones. If that becomes a problem, drop `whitespace-nowrap` below `md`.
- The grayscale rule on `.photo-frame__media img` is a taste decision lifted from the mock; delete that one rule to show true colour.
- The walk-ins note now appears in the topbar, the hero notes line, the stamp and the footer. The owner reviewed the repetition and kept it (see plan 023's status note).
