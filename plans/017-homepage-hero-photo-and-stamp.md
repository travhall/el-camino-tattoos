# Plan 017: Add a framed hero photo and a decorative "walk-ins" stamp to the homepage

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 247a87d..HEAD -- "src/app/(site)/page.tsx" src/components/shop-notes.tsx src/components/piece-grid.tsx src/lib/content.ts src/styles/components.css`
> Compare the "Current state" excerpts against the live code before
> proceeding; on a mismatch, treat it as a STOP condition.
>
> **Run this plan after plan 015** (sharp corners) if both are in flight:
> the stamp badge deliberately does not use `rounded-full` so it stays
> consistent with plan 015's outcome — see Step 2's comment. If plan 015
> hasn't landed yet, the stamp still renders correctly (a square stamp is
> valid either way); there's no hard ordering dependency, just a "don't
> undo the other plan" note.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none (see the ordering note above re: plan 015 — advisory, not blocking)
- **Category**: direction (design-system change, owner-approved)
- **Planned at**: commit `247a87d`, 2026-09-30

## Why this matters

The owner reviewed a design mock and approved porting its homepage hero
identity: a framed photo (a "pinned print" treatment) paired with a
circular-in-the-reference, decorative ink-stamp badge reading "Walk-ins
Welcome." Today's homepage (`src/app/(site)/page.tsx`) has no photo at all —
just a heading and a line of shop-notes text, then straight into the
Artists and Recent Work grids. This plan adds the photo and the stamp
without touching anything below the fold, and without inventing a new
content field: it reuses the same `getPieces()` data the homepage already
fetches (pieces sort featured-first, then newest, so `pieces[0]` is already
the right choice with zero new Keystatic schema).

The stamp is genuinely decorative, not a second source of truth: the
existing `<ShopNotes>` component already renders the accessible, real-text
version of the walk-ins/consultation copy right next to it. The stamp
duplicates that fact visually for two words ("Walk-ins Welcome"), so it is
marked `aria-hidden="true"` — this also means axe-core's `color-contrast`
rule (which skips elements hidden from assistive tech and their
descendants) never evaluates its small badge text, so there's no contrast
budget to hit at 10px. If you remove `aria-hidden`, you must also make the
stamp text large enough to pass contrast as real content, and stop treating
it as decorative — that's a bigger change than this plan scopes.

## Current state

`src/app/(site)/page.tsx` (full file, 45 lines):

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArtistGrid } from "@/components/artist-grid";
import { PieceGrid } from "@/components/piece-grid";
import { ShopNotes } from "@/components/shop-notes";
import { getArtists, getPieces, getSite } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { description } = await getSite();
  return pageMetadata({ path: "/", description });
}

export default async function Home() {
  const [artists, pieces, site] = await Promise.all([
    getArtists(),
    getPieces(),
    getSite(),
  ]);

  return (
    <div className="stack stack--xl">
      <div className="stack">
        <h1 className="display">El Camino Tattoos</h1>
        <ShopNotes site={site} />
      </div>

      <section aria-labelledby="artists-heading" className="stack stack--lg">
        <h2 id="artists-heading">Artists</h2>
        <ArtistGrid artists={artists} />
      </section>

      <section aria-labelledby="work-heading" className="stack stack--lg">
        <div className="section-header">
          <h2 id="work-heading">Recent work</h2>
          <Link href="/portfolio" className="link">
            View all
          </Link>
        </div>
        <PieceGrid pieces={pieces.slice(0, 8)} artists={artists} />
      </section>
    </div>
  );
}
```

`src/lib/content.ts` — the relevant types and `getPieces()` (already
implemented, unchanged by this plan, quoted so you know exactly what's
available):

```ts
export type Piece = {
  slug: string;
  title: string;
  artistSlug: string;
  image: string;
  featured: boolean;
  style: string;
  placement: string;
  date: string | null;
};

/** Featured pieces first, then newest. Pieces missing an artist or image are skipped. */
export const getPieces = cache(async (): Promise<Piece[]> => {
  const entries = await reader.collections.pieces.all();
  return entries
    .flatMap(({ slug, entry }) =>
      entry.artist && entry.image
        ? [
            {
              slug,
              title: entry.title,
              artistSlug: entry.artist,
              image: entry.image,
              featured: entry.featured,
              style: entry.style,
              placement: entry.placement,
              date: entry.date,
            },
          ]
        : [],
    )
    .sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        (b.date ?? "").localeCompare(a.date ?? ""),
    );
});
```

`src/components/shop-notes.tsx` (full file, 13 lines) is the existing
accessible text this plan's stamp duplicates decoratively — unchanged by
this plan, quoted for context:

```tsx
import type { Site } from "@/lib/content";

/** Walk-in and consultation lines from the shop info. Renders nothing if neither is set. */
export function ShopNotes({ site }: { site: Site }) {
  const notes = [
    site.walkIns ? site.walkInNote || "Walk-ins welcome." : "",
    site.consultationNote,
  ].filter(Boolean);
  if (notes.length === 0) return null;

  return <p className="lead measure">{notes.join(" ")}</p>;
}
```

`src/components/piece-grid.tsx` is the existing pattern for rendering a
`Piece`'s image with Next's `Image` component (fill + sizes + a positioned
wrapper, alt text as `"{title} by {artistName}"`) — model the new hero photo
on this exact pattern:

```tsx
<div className="piece-tile__media">
  <Image
    src={piece.image}
    alt={artistName ? `${piece.title} by ${artistName}` : piece.title}
    fill
    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
    className="image-cover piece-tile__image"
  />
</div>
```

Confirmed CSS roles already exist and are mapped to Tailwind utilities
(`grep -n "accent-mark\|surface-raised\|surface-sunken" src/styles/theme.css`):
`--color-accent-mark`, `--color-surface-raised`, `--color-surface-sunken` —
so `border-accent-mark`, `text-accent-mark`, `bg-surface-raised`,
`bg-surface-sunken` are valid Tailwind classes today, no new role needed.

Confirmed fluid spacing tokens (`src/styles/space-scale.css`) include a
`2xs` step: `--spacing-fluid-2xs: clamp(0.5rem, 0.4783rem + 0.1087vw, 0.5625rem);`
— so `p-fluid-2xs` and `gap-fluid-lg` are valid.

The end-to-end test fixtures (`scripts/fixtures.mjs`, seeded by `pnpm test`
for the whole suite) always include at least one piece with a real
(generated) image — `zz-fixture-koi` (dated) and `zz-fixture-rose`
(undated) — so `pieces[0]` will resolve to `zz-fixture-koi` during tests,
exercising the new hero markup automatically; you do not need to add or
change any fixture.

`content/site.yaml` has `walkIns: true` committed today, so the stamp will
render during both `pnpm dev` and `pnpm test` without any content change.

## Commands you will need

| Purpose   | Command                                      | Expected on success |
| --------- | ---------------------------------------------| -------------------- |
| Typecheck | `pnpm exec tsc --noEmit`                     | exit 0, no output    |
| Lint      | `pnpm lint`                                   | exit 0                |
| Format    | `pnpm format:check` (fix with `pnpm format`)  | exit 0                |
| Tests     | `pnpm test` (seeds fixtures, builds, runs Playwright) | all pass |
| One test  | `pnpm test --grep "hero"`                     | matching tests pass  |

Use `pnpm` only.

## Scope

**In scope** (the only files you should create or modify):

- `src/components/hero-photo.tsx` (new file)
- `src/app/(site)/page.tsx`
- `src/styles/components.css` (append new rules only — do not touch any existing rule)
- `tests/site.spec.ts` (add one test to the existing `"shop info"` describe block)

**Out of scope** (do NOT touch):

- `src/lib/content.ts` — `getPieces()`, `Piece`, and every other type are already sufficient; no new content field.
- `src/components/shop-notes.tsx`, `src/components/piece-grid.tsx` — read as reference patterns only.
- `keystatic.config.ts` — no schema change.
- The Artists and Recent Work sections of the homepage, or any other route.
- `scripts/figma-manifest.mjs` — this plan adds no new *shared* tracked measurement (the photo reuses the existing `aspect-[4/5]` convention already used by `.piece-tile__media`, untracked today for the same reason); if the owner later wants the hero specifically tracked in Figma, that's a follow-up.
- Plans 015 and 016 — independent work; do not start them here.

## Git workflow

- Branch: `advisor/017-homepage-hero`
- Commit per logical unit, e.g. `feat(home): add hero photo frame and stamp component`, then `feat(home): wire hero into the homepage`, then `test(home): cover the hero photo and stamp`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create `src/components/hero-photo.tsx`

New file, full contents:

```tsx
import Image from "next/image";
import type { Piece } from "@/lib/content";

export function HeroPhoto({
  piece,
  artistName,
  walkIns,
}: {
  piece: Piece | null;
  artistName: string | undefined;
  walkIns: boolean;
}) {
  if (!piece) return null;

  return (
    <div className="home-hero__photo">
      <div className="photo-frame">
        <div className="photo-frame__media">
          <Image
            src={piece.image}
            alt={
              artistName ? `${piece.title} by ${artistName}` : piece.title
            }
            fill
            sizes="(min-width: 768px) 40vw, 90vw"
            className="image-cover"
            priority
          />
        </div>
        <span aria-hidden="true" className="photo-frame__tape" />
      </div>
      {walkIns ? (
        <div aria-hidden="true" className="stamp">
          <span className="stamp__line">Walk-ins</span>
          <span className="stamp__line">Welcome</span>
        </div>
      ) : null}
    </div>
  );
}
```

`priority` is set because this is the homepage's largest above-the-fold
image (the LCP candidate) — match Next.js's own guidance for hero images,
and note no other `<Image>` in this codebase currently sets it (this is the
first one that should).

**Verify**: `pnpm exec tsc --noEmit` → exit 0 (it will fail until `Piece` is
imported correctly and the file compiles standalone; this step alone won't
yet fail on missing usage since the component isn't wired in yet).

### Step 2: Add the CSS

Append to the end of `src/styles/components.css`, inside the existing
`@layer components { ... }` block (add these rules just before the file's
closing `}`, after `.status-page h1:focus`):

```css
  /* Homepage hero: intro text beside a framed, "pinned" photo with a
     decorative ink-stamp badge. */
  .home-hero {
    @apply grid items-center gap-fluid-lg md:grid-cols-2;
  }

  .home-hero__photo {
    @apply relative;
  }

  /* A bordered mat around the photo, like a pinned-up print. */
  .photo-frame {
    @apply relative border border-line bg-surface p-fluid-2xs;
  }

  .photo-frame__media {
    @apply relative aspect-[4/5] bg-surface-sunken;
  }

  /* A strip of "tape" pinning the photo down. Decorative only. */
  .photo-frame__tape {
    @apply absolute top-[-0.75rem] left-1/2 h-6 w-16 -translate-x-1/2 -rotate-2 bg-surface-raised/80;
  }

  /* Decorative ink-stamp badge echoing the walk-ins note ShopNotes already
     states in real text; aria-hidden because it duplicates that accessible
     copy (see plans/017-homepage-hero-photo-and-stamp.md). Square, not
     round: stays inside the site's sharp-corner shape language (plan 015)
     while still reading as a stamp via the rotation and double ring. */
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

**Verify**: `grep -n "\.home-hero\b\|\.home-hero__photo\|\.photo-frame\b\|\.photo-frame__media\|\.photo-frame__tape\|\.stamp\b\|\.stamp__line" src/styles/components.css` shows all 7 new class names.

### Step 3: Wire the hero into the homepage

Replace the full contents of `src/app/(site)/page.tsx` with:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArtistGrid } from "@/components/artist-grid";
import { HeroPhoto } from "@/components/hero-photo";
import { PieceGrid } from "@/components/piece-grid";
import { ShopNotes } from "@/components/shop-notes";
import { getArtists, getPieces, getSite } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { description } = await getSite();
  return pageMetadata({ path: "/", description });
}

export default async function Home() {
  const [artists, pieces, site] = await Promise.all([
    getArtists(),
    getPieces(),
    getSite(),
  ]);

  const heroPiece = pieces[0] ?? null;
  const heroArtistName = heroPiece
    ? artists.find((artist) => artist.slug === heroPiece.artistSlug)?.name
    : undefined;

  return (
    <div className="stack stack--xl">
      <div className="home-hero">
        <div className="home-hero__intro stack">
          <h1 className="display">El Camino Tattoos</h1>
          <ShopNotes site={site} />
        </div>
        <HeroPhoto
          piece={heroPiece}
          artistName={heroArtistName}
          walkIns={site.walkIns}
        />
      </div>

      <section aria-labelledby="artists-heading" className="stack stack--lg">
        <h2 id="artists-heading">Artists</h2>
        <ArtistGrid artists={artists} />
      </section>

      <section aria-labelledby="work-heading" className="stack stack--lg">
        <div className="section-header">
          <h2 id="work-heading">Recent work</h2>
          <Link href="/portfolio" className="link">
            View all
          </Link>
        </div>
        <PieceGrid pieces={pieces.slice(0, 8)} artists={artists} />
      </section>
    </div>
  );
}
```

The only changes from the current file: the `HeroPhoto` import, the
`heroPiece`/`heroArtistName` computation, and the intro `<div className="stack">`
becoming a `<div className="home-hero">` wrapping the original intro
(now `<div className="home-hero__intro stack">`, same content, same `h1`
and `<ShopNotes>`) alongside the new `<HeroPhoto>`. The Artists and Recent
Work sections are untouched, copy-pasted verbatim.

**Verify**: `pnpm exec tsc --noEmit && pnpm lint` → both exit 0.

### Step 4: Add a test

In `tests/site.spec.ts`, inside the existing `test.describe("shop info", () => { ... })`
block, add (after the `"the homepage leads with the walk-in and consultation notes"`
test is a reasonable spot, but anywhere in that describe block is fine):

```ts
test("the homepage hero shows a photo with a decorative walk-ins stamp", async ({
  page,
}) => {
  await open(page, "/");
  const hero = page.locator(".home-hero__photo");
  await expect(hero.getByRole("img")).toBeVisible();
  // The stamp duplicates the walk-ins note ShopNotes already states as real
  // text, so it must stay out of the accessibility tree.
  const stamp = page.locator(".stamp");
  await expect(stamp).toBeVisible();
  await expect(stamp).toHaveAttribute("aria-hidden", "true");
});
```

No new imports needed — `expect`, `test`, and the `open` helper are already
defined at the top of this file.

**Verify**: `pnpm test --grep "hero"` → passes.

### Step 5: Full verification

Run, in order: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm format:check`
(fix with `pnpm format` if needed), `pnpm test`.

`pnpm test` re-runs the full axe sweep on every route including `/`, now
with the hero photo and stamp present — this is the main regression check:
the stamp's `aria-hidden` must mean axe never flags its 10px text for
contrast (if it does, something about the `aria-hidden` wiring is wrong —
do not "fix" it by enlarging the text; fix the aria-hidden attribute
instead). The 44px touch-target test also runs on `/` — the hero photo and
stamp are non-interactive (no link, no button), so neither should be
flagged; if either is, something made it accidentally focusable/interactive
and that's a bug to report, not silence.

**Verify**: all four commands exit 0.

## Test plan

Covered in Step 4: one test confirms the hero image renders with an
accessible role and the stamp is present but correctly hidden from
assistive tech. The existing axe sweep (`pnpm test`, every route, both
themes, two widths) is the regression guard for contrast and touch-target
issues on the new markup; no separate visual test is needed since this repo
doesn't do screenshot testing.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0 and `pnpm format:check` exits 0
- [ ] `pnpm test` exits 0, including the new hero test
- [ ] `grep -n "HeroPhoto" src/components/hero-photo.tsx "src/app/(site)/page.tsx"` shows the component defined and used
- [ ] `grep -n "aria-hidden" src/components/hero-photo.tsx` shows it on both the tape and the stamp
- [ ] Visiting `/` in `pnpm dev` shows a framed photo with a rotated "Walk-ins / Welcome" stamp next to the intro text, at both mobile and desktop widths
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any excerpt in "Current state" doesn't match the live code.
- `pieces[0]` is ever a piece with no usable image at build time (shouldn't
  happen — `getPieces()` already filters out entries missing `image`) — if
  you observe a broken image in `pnpm dev`, report it rather than adding a
  fallback image; that would mean `getPieces()`'s own filter is broken,
  which is outside this plan's scope.
- The axe sweep flags the stamp's text for contrast — this means the
  `aria-hidden` attribute isn't taking effect as expected; report the exact
  axe violation rather than changing the stamp's colors or font size.
- `content/site.yaml`'s `walkIns` is ever absent/undefined rather than a
  clean boolean — `Site.walkIns` is typed `boolean`, not `boolean | undefined`, so this shouldn't be possible, but if you see a type error here, report it rather than adding an `?? false` guard that papers over a real type mismatch upstream.

## Maintenance notes

- If the owner later wants the hero to source a specific, curated photo
  instead of "whichever piece sorts first," that's a one-line change in
  `page.tsx` (e.g. a `featured` piece lookup is already how the sort works —
  ensuring the right piece is marked `featured: true` in Keystatic achieves
  this today with no code change).
- The stamp's copy ("Walk-ins" / "Welcome") is hardcoded, not pulled from
  `site.walkInNote` — that field holds full-sentence prose meant for
  `ShopNotes`, not two short badge lines. If the owner wants the badge text
  itself to be editable, that needs a new short-form Keystatic field, not a
  reuse of `walkInNote`; out of scope here.
- If plan 015 (sharp corners) lands after this plan, nothing needs to
  change — the stamp was already built without `rounded-full`. If plan 015
  is later *reverted*, this stamp staying square (not round) will look
  inconsistent with a then-rounded site; that's an acceptable, explicitly
  documented tradeoff, not a bug.
- A reviewer should check the photo's crop at both the `md:grid-cols-2`
  breakpoint and just below it (where the stamp's `right-[-1rem] bottom-[-1rem]`
  offset could crowd the section below on very narrow viewports) — nudge
  the hero section's bottom margin if it looks cramped; that's a legitimate
  small follow-up, not a sign this plan is wrong.
