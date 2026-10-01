# Plan 019: Split the Artists page into resident/apprentice and guest artists

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 881ef16..HEAD -- src/components/artist-card.tsx "src/app/(site)/artists/page.tsx" scripts/fixtures.mjs src/lib/content.ts`
> Compare the "Current state" excerpts against the live code before
> proceeding; on a mismatch, treat it as a STOP condition. **This plan
> requires plan 018 (the `role`/`visitDates` fields) to be merged first** —
> if `Artist.role` doesn't exist in `src/lib/content.ts`, STOP: plan 018
> hasn't landed yet.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plan 018 (`Artist.role`/`Artist.visitDates` must exist)
- **Category**: direction (design-system change, owner-approved)
- **Planned at**: commit `881ef16`, 2026-09-30

## Why this matters

The reviewed design mock's Artists page does three things the current one
doesn't: separates resident/apprentice artists from guest artists (with the
guest's visiting dates shown), invites traveling tattooers to reach out, and
gives visitors unsure who to pick a low-friction way forward ("send us the
idea, we'll match you"). All three match real, stated facts: a small
resident crew, not taking new residents or apprentices, open to occasional
guest artists, and every inquiry lands in one shared studio inbox regardless
of artist preference. Today's Artists page is just a heading and one flat
grid of every artist — plan 018 added the data (`role`, `visitDates`); this
plan uses it.

## Current state

`src/app/(site)/artists/page.tsx` (full file, 17 lines):

```tsx
import type { Metadata } from "next";
import { ArtistGrid } from "@/components/artist-grid";
import { getArtists } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { siteName } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Artists",
  description: `The artists at ${siteName}: their styles and their portfolios.`,
  path: "/artists",
});

export default async function ArtistsPage() {
  const artists = await getArtists();

  return (
    <div className="stack stack--lg">
      <h1>Artists</h1>
      <ArtistGrid artists={artists} headingLevel={2} />
    </div>
  );
}
```

`src/components/artist-card.tsx` (full file, 33 lines):

```tsx
import Image from "next/image";
import Link from "next/link";
import type { Artist } from "@/lib/content";

/** `headingLevel` follows the page: h3 under a section's h2, h2 under the page h1. */
export function ArtistCard({
  artist,
  headingLevel = 3,
}: {
  artist: Artist;
  headingLevel?: 2 | 3;
}) {
  const Heading = `h${headingLevel}` as const;
  return (
    <Link href={`/artists/${artist.slug}`} className="artist-card">
      <div className="artist-card__media">
        {artist.photo && (
          <Image
            src={artist.photo}
            alt="" // decorative: the artist's name is the link text beside it
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="image-cover"
          />
        )}
      </div>
      <Heading className="artist-card__name">{artist.name}</Heading>
      {artist.specialties.length > 0 && (
        <p className="artist-card__meta">{artist.specialties.join(", ")}</p>
      )}
    </Link>
  );
}
```

`src/components/artist-grid.tsx` (full file, 24 lines, unchanged by this
plan — quoted for reference since `ArtistCard`'s new prop must stay
compatible with how it's called here and from
`src/app/(site)/page.tsx`'s homepage preview):

```tsx
import { ArtistCard } from "@/components/artist-card";
import type { Artist } from "@/lib/content";

export function ArtistGrid({
  artists,
  headingLevel,
}: {
  artists: readonly Artist[];
  headingLevel?: 2 | 3;
}) {
  if (artists.length === 0) {
    return <p className="empty-state">No artists have been added yet.</p>;
  }

  return (
    <ul className="artist-grid">
      {artists.map((artist) => (
        <li key={artist.slug}>
          <ArtistCard artist={artist} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
```

After plan 018, `Artist` (in `src/lib/content.ts`) has:

```ts
export type Artist = {
  slug: string;
  name: string;
  photo: string | null;
  specialties: readonly string[];
  bio: string;
  instagram: string;
  order: number;
  role: "resident" | "apprentice" | "guest";
  visitDates: string;
};
```

`src/lib/content.ts`'s `Site` type includes `email: string` (empty string
when unset — `content/site.yaml` has no `email:` line today, so
`site.email` is `""` in dev/prod until the owner adds one). The existing
convention for an optional contact detail is to hide it when empty — see
`src/components/shop-info.tsx:36`, `<a href={`mailto:${site.email}`}>`,
always guarded by a truthiness check one level up. Follow the same pattern
here.

`src/components/ui/button.tsx` exports `ButtonLink` (a `<Link>` styled as a
button — same `variant`/`size` props as `Button`), already used elsewhere
(e.g. `src/components/site-header.tsx`: `<ButtonLink href="/contact">Request</ButtonLink>`).

`scripts/fixtures.mjs`, `fixtures.artists` (lines 16–34) has exactly two
entries today, neither with a `role`. This plan adds a third:

```js
  artists: [
    {
      slug: "zz-fixture-one",
      name: "Fixture One",
      specialties: ["Fine line", "Blackwork"],
      bio: "A fixture artist used only by the test suite.",
      instagram: "fixture_one",
      order: 1,
      photo: { file: "photo.png", color: [120, 140, 100] },
    },
    {
      slug: "zz-fixture-two",
      name: "Fixture Two",
      specialties: ["Traditional"],
      bio: "Another fixture artist.",
      instagram: "fixture_two",
      order: 2,
    },
  ],
```

The writer loop (lines 132–154) always emits `name`, `specialties`, `bio`,
`instagram`, `order`, and `photo` (if present) — it has no `role`/
`visitDates` handling yet; this plan adds that too, only emitting those
lines when the fixture object actually sets them (so the two existing
fixtures, which won't set `role`, keep falling back to `"resident"` via
`getArtists()`, exactly as plan 018 intended — don't give them an explicit
`role: resident` line, that would defeat the point of testing the fallback).

## Commands you will need

| Purpose   | Command                                               | Expected on success |
| --------- | ----------------------------------------------------- | ------------------- |
| Typecheck | `pnpm exec tsc --noEmit`                              | exit 0, no output   |
| Lint      | `pnpm lint`                                           | exit 0              |
| Format    | `pnpm format:check` (fix with `pnpm format`)          | exit 0              |
| Tests     | `pnpm test` (seeds fixtures, builds, runs Playwright) | all pass            |
| One test  | `pnpm test --grep "artists"`                          | matching tests pass |

Use `pnpm` only.

## Scope

**In scope** (the only files you should modify):

- `src/components/artist-card.tsx`
- `src/app/(site)/artists/page.tsx`
- `scripts/fixtures.mjs` (add one fixture artist with `role: "guest"`, and teach the writer loop to emit `role`/`visitDates` lines when present)
- `tests/routes.ts` (no new route, but see Step 4 — you likely don't need to touch this; only if a new fixture-dependent assertion requires it, which it shouldn't)
- `tests/site.spec.ts` or `tests/interactions.spec.ts` (add tests — pick whichever fits; `site.spec.ts`'s `"shop info"`/similar describe blocks already test Artists-adjacent content against real config, but this feature needs the new _fixture_ guest artist, so model it after a fixture-dependent test in `interactions.spec.ts` instead — your call, document which you picked and why in your report)

**Out of scope** (do NOT touch):

- `src/lib/content.ts`, `keystatic.config.ts` — plan 018's territory, already landed.
- `src/app/(site)/page.tsx` (the homepage) — its artist preview stays a flat grid; this plan only restructures the dedicated `/artists` page.
- `src/components/artist-grid.tsx` — unchanged; still just renders a flat list of whatever `artists` array it's given. The split happens in `page.tsx` by filtering into two arrays before rendering two `<ArtistGrid>`s.
- `src/app/(site)/artists/[slug]/page.tsx` (the individual artist profile page) — not touched.
- Any icon system, SVG asset, or new visual motif beyond what's specified in Step 3 — the reviewed mock uses a decorative "FlashStar" icon here; this codebase has no icon system, and this plan does not introduce one. Text only.

## Git workflow

- Branch: `advisor/019-artists-resident-guest`
- Commit per logical unit, e.g. `feat(artists): show a guest's visiting dates on the artist card`, `feat(artists): split residents from guests, add CTAs`, `test(fixtures): add a guest fixture artist`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Show a guest's visiting dates on `ArtistCard`

In `src/components/artist-card.tsx`, after the existing `specialties`
paragraph, add:

```tsx
{
  artist.specialties.length > 0 && (
    <p className="artist-card__meta">{artist.specialties.join(", ")}</p>
  );
}
{
  artist.role === "guest" && artist.visitDates && (
    <p className="artist-card__meta">Guest · {artist.visitDates}</p>
  );
}
```

This is intentionally additive and generic — it works anywhere `ArtistCard`
is already used (the homepage preview, the dedicated Artists page), not
just where this plan adds new sections.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 2: Add a guest fixture artist

In `scripts/fixtures.mjs`, add a third entry to `fixtures.artists` (after
`zz-fixture-two`):

```js
    {
      slug: "zz-fixture-guest",
      name: "Fixture Guest",
      specialties: ["Illustrative"],
      bio: "A visiting fixture artist used only by the test suite.",
      instagram: "fixture_guest",
      order: 3,
      role: "guest",
      visitDates: "Nov 14–16",
      photo: { file: "photo.png", color: [180, 100, 140] },
    },
```

In the writer loop (around line 132), add `role`/`visitDates` lines only
when the fixture object sets them:

```js
for (const artist of fixtures.artists) {
  const lines = [
    `name: ${artist.name}`,
    "specialties:",
    ...artist.specialties.map((s) => `  - ${s}`),
    `bio: ${artist.bio}`,
    `instagram: ${artist.instagram}`,
    `order: ${artist.order}`,
  ];
  if (artist.role) lines.push(`role: ${artist.role}`);
  if (artist.visitDates) lines.push(`visitDates: ${artist.visitDates}`);
  if (artist.photo) {
    const dir = at("public/images/artists", artist.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, artist.photo.file),
      png(600, 800, artist.photo.color),
    );
    lines.push(`photo: /images/artists/${artist.slug}/${artist.photo.file}`);
  }
  await writeFile(
    at("content/artists", `${artist.slug}.yaml`),
    `${lines.join("\n")}\n`,
  );
}
```

(Only the `if (artist.role) ...` / `if (artist.visitDates) ...` two lines
are new; everything else in this loop is unchanged — shown in full so you
can see exactly where the insertion goes.) The cleanup loop further down
(`for (const artist of fixtures.artists)` removing `content/artists/*.yaml`
and `public/images/artists/*`) already works by slug and needs no change —
confirm this yourself by reading it before assuming so.

**Verify**: `node scripts/fixtures.mjs seed && cat content/artists/zz-fixture-guest.yaml && node scripts/fixtures.mjs clean` shows a YAML file containing `role: guest` and `visitDates: Nov 14–16`, then cleans up.

### Step 3: Restructure the Artists page

Replace `src/app/(site)/artists/page.tsx` in full:

```tsx
import type { Metadata } from "next";
import { ArtistGrid } from "@/components/artist-grid";
import { ButtonLink } from "@/components/ui/button";
import { getArtists, getSite } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { siteName } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Artists",
  description: `The artists at ${siteName}: their styles and their portfolios.`,
  path: "/artists",
});

export default async function ArtistsPage() {
  const [artists, site] = await Promise.all([getArtists(), getSite()]);
  const residents = artists.filter((artist) => artist.role !== "guest");
  const guests = artists.filter((artist) => artist.role === "guest");

  return (
    <div className="stack stack--xl">
      <div className="stack">
        <h1>Artists</h1>
        <p className="lead measure">
          Pick an artist you connect with. Every inquiry comes through the same
          studio inbox, so you can&rsquo;t go wrong asking.
        </p>
      </div>

      <ArtistGrid artists={residents} headingLevel={2} />

      {guests.length > 0 && (
        <section aria-labelledby="guests-heading" className="stack stack--lg">
          <h2 id="guests-heading">Visiting artists</h2>
          <ArtistGrid artists={guests} headingLevel={3} />
        </section>
      )}

      <div className="stack">
        <h2>Not sure who&rsquo;s right for you?</h2>
        <p className="measure">
          Tell us what you&rsquo;re thinking and we&rsquo;ll match your idea
          with the right hands. Each artist keeps their own book, but you only
          need to knock on one door.
        </p>
        <div>
          <ButtonLink href="/contact">Request an appointment</ButtonLink>
        </div>
      </div>

      <div className="stack">
        <h2>Traveling tattooer?</h2>
        <p className="measure">
          We&rsquo;re open to the occasional guest artist who shares our
          approach to tattooing. Our resident crew is full and we aren&rsquo;t
          taking apprentice or new-resident applications right now, but if
          you&rsquo;re passing through, send over your portfolio.
        </p>
        {site.email && (
          <p>
            <a
              href={`mailto:${site.email}?subject=${encodeURIComponent("Guest artist inquiry")}`}
              className="link"
            >
              {site.email}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
```

Heading levels: page `h1`, then `h2` for "Visiting artists" (only rendered
when there are guests), "Not sure who's right for you?", and "Traveling
tattooer?" — all siblings under the page `h1`, no skipped levels, matching
`ArtistGrid`'s existing `headingLevel` contract (residents get `h2` via
their cards since they're not inside a `<section>` with its own `h2`;
guests get `h3` via their cards since they're nested under the "Visiting
artists" `h2`) — this mirrors how `headingLevel` is already used elsewhere
in this codebase (see `ArtistCard`'s own doc comment: "h3 under a section's
h2, h2 under the page h1").

Do not invent copy beyond what's here — the "industry-standard pricing,"
"free consultations," deposit amount, etc. already live on the homepage/
Contact page via `<ShopNotes>`; this page's new copy only restates facts
already decided (single shared inbox, resident crew full, open to guest
artists) and does not duplicate pricing/deposit language.

**Verify**: `pnpm exec tsc --noEmit && pnpm lint` → both exit 0.

### Step 4: Add tests

In `tests/interactions.spec.ts` (fixture-dependent tests live here per this
repo's convention — see the file's existing tests for the `open` helper
pattern already imported at the top), add:

```ts
test.describe("artists page", () => {
  test("splits residents from guests and shows the guest's visiting dates", async ({
    page,
  }) => {
    await open(page, "/artists");
    await expect(
      page.getByRole("heading", { name: "Visiting artists" }),
    ).toBeVisible();
    await expect(page.getByText("Guest · Nov 14–16")).toBeVisible();
  });

  test("offers a match-me CTA and a traveling-tattooer contact", async ({
    page,
  }) => {
    await open(page, "/artists");
    await expect(
      page.getByRole("heading", { name: "Not sure who's right for you?" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Request an appointment" }),
    ).toHaveAttribute("href", "/contact");
    await expect(
      page.getByRole("heading", { name: "Traveling tattooer?" }),
    ).toBeVisible();
  });
});
```

Adjust the "Not sure who's right for you?" heading-name match if your
apostrophe character differs from what actually renders (`&rsquo;` renders
as a real `’`, Playwright's `name` matcher does substring/accessible-name
matching on the rendered text, not the JSX source) — verify by running the
test rather than guessing.

**Verify**: `pnpm test --grep "artists"` → both new tests pass.

### Step 5: Full verification

Run, in order: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm format:check`
(fix with `pnpm format` if needed), `pnpm test`.

`pnpm test` includes the axe sweep on `/artists` in both themes at both
widths — a new heading structure and a new mailto link are both worth axe's
scrutiny; if it flags heading order, re-check Step 3's heading-level
reasoning rather than just renumbering until axe is quiet.

**Verify**: all four commands exit 0.

## Test plan

Covered in Step 4: the resident/guest split renders correctly with a real
guest fixture (visiting dates shown), and both new CTA sections render with
correct heading text and link targets. The existing axe sweep covers
accessibility regressions on `/artists` (now exercising three new headings,
a new link, and the guest fixture's card) in both themes and both widths.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0 and `pnpm format:check` exits 0
- [ ] `pnpm test` exits 0, including the two new `"artists page"` tests
- [ ] `grep -n 'role === "guest"' src/components/artist-card.tsx` shows the new conditional
- [ ] `grep -n "zz-fixture-guest" scripts/fixtures.mjs` shows the new fixture artist
- [ ] Visiting `/artists` in `pnpm dev` (after `node scripts/fixtures.mjs seed`, or with real Keystatic content that includes a guest) shows residents in one grid, a separate "Visiting artists" section for guests, and both CTA sections
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `Artist.role` doesn't exist in `src/lib/content.ts` — plan 018 hasn't landed; do not add the field yourself here, that's out of scope for this plan.
- Any excerpt in "Current state" doesn't match the live code.
- The axe sweep flags a heading-order or link-name violation you can't resolve by adjusting this plan's own markup (not by touching `ArtistGrid`, which is out of scope).
- `site.email` handling needs to diverge from the existing `shop-info.tsx` pattern for some reason you discover — report it rather than inventing a new convention.

## Maintenance notes

- If the owner later wants apprentices visually distinguished from
  residents (the "Apprentice" label question plan 018 left open), that's an
  additional `artist.role === "apprentice"` branch in `ArtistCard` — this
  plan deliberately only branches on `"guest"`, since that's the only
  role with new information to show (visiting dates) and the only split
  this plan was asked to build.
- The "Traveling tattooer?" section's copy ("resident crew is full,"
  "not taking apprentice or new-resident applications") is evergreen shop
  policy, not tied to any specific artist's data — if that policy changes,
  it's a copy edit in `page.tsx`, not a content-model change.
- `site.email` is empty in this repo today (no real value in
  `content/site.yaml`); the guest-inquiry mailto link simply won't render
  until the owner adds one, exactly like the existing phone-number handling
  elsewhere.
