# Plan 018: Add a `role` and `visitDates` field to artists

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 881ef16..HEAD -- keystatic.config.ts src/lib/content.ts`
> Compare the "Current state" excerpts against the live code before
> proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (plan 019, the Artists page restructure, depends on this one)
- **Category**: direction (content-model change, owner-approved)
- **Planned at**: commit `881ef16`, 2026-09-30

## Why this matters

The reviewed design mock's Artists page splits resident artists from guest
artists and adds a section inviting traveling tattooers to reach out — which
matches real, stated shop facts (small resident crew, not taking new
residents or apprentices right now, open to occasional guest artists). But
today's `artists` Keystatic collection has no field to distinguish a
resident from a guest at all — every artist is just a name, photo,
specialties, bio, Instagram, and a sort order. This plan adds the two fields
a later plan (019) needs to build that split: `role` (resident / apprentice
/ guest) and `visitDates` (free text, meaningful only for guests — e.g. "Nov
14–16"). This plan is schema and data-plumbing only; it does not touch any
page or component that renders artists.

There is no real artist content in this repo yet (`content/artists/`
contains only a `.gitkeep`), so there is no existing data to migrate — every
artist created from now on gets `role` via the Keystatic field's
`defaultValue`, and `getArtists()` defensively falls back to `"resident"`
for any entry that predates this field, matching the existing defensive
pattern already used for `order` (`entry.order ?? 100`).

## Current state

`keystatic.config.ts`, the `artists` collection (lines 87–113 in full):

```ts
    artists: collection({
      label: "Artists",
      slugField: "name",
      path: "content/artists/*",
      format: { data: "yaml" },
      columns: ["name", "order"],
      schema: {
        name: fields.slug({ name: { label: "Name" } }),
        photo: fields.image({
          label: "Photo",
          description: "Portrait for the profile and artist cards.",
          directory: "public/images/artists",
          publicPath: "/images/artists/",
        }),
        specialties: fields.array(fields.text({ label: "Specialty" }), {
          label: "Specialties",
          description: "Short, specific styles. e.g. Fine line, Traditional.",
          itemLabel: (props) => props.value,
        }),
        bio: fields.text({ label: "Bio", multiline: true }),
        instagram: instagramField(),
        order: fields.integer({
          label: "Order",
          description: "Lower numbers appear first.",
          defaultValue: 100,
        }),
      },
    }),
```

No `fields.select` is used anywhere else in this file today — this plan
introduces the first one. It's a standard Keystatic field type (same package
as `fields.text`/`fields.image`/etc., already imported at the top of the
file: `import { collection, config, fields, singleton } from "@keystatic/core";`).

`src/lib/content.ts`, the `Artist` type and `getArtists()` (lines 8–16 and
42–55 in full):

```ts
export type Artist = {
  slug: string;
  name: string;
  photo: string | null;
  specialties: readonly string[];
  bio: string;
  instagram: string;
  order: number;
};
```

```ts
export const getArtists = cache(async (): Promise<Artist[]> => {
  const entries = await reader.collections.artists.all();
  return entries
    .map(({ slug, entry }) => ({
      slug,
      name: entry.name,
      photo: entry.photo,
      specialties: entry.specialties,
      bio: entry.bio,
      instagram: normalizeInstagramHandle(entry.instagram),
      order: entry.order ?? 100,
    }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
});
```

`scripts/fixtures.mjs` writes two fixture artists (`zz-fixture-one`,
`zz-fixture-two`) as plain YAML with no `role:` line (lines 132–154) — after
this plan, both will fall back to `"resident"` via `getArtists()`'s default,
so no fixture change is needed for this plan (plan 019 adds a third,
guest-role fixture artist when it needs one to test the split).

## Commands you will need

| Purpose   | Command                                               | Expected on success |
| --------- | ----------------------------------------------------- | ------------------- |
| Typecheck | `pnpm exec tsc --noEmit`                              | exit 0, no output   |
| Lint      | `pnpm lint`                                           | exit 0              |
| Format    | `pnpm format:check` (fix with `pnpm format`)          | exit 0              |
| Tests     | `pnpm test` (seeds fixtures, builds, runs Playwright) | all pass            |

Use `pnpm` only.

## Scope

**In scope** (the only files you should modify):

- `keystatic.config.ts` (the `artists` collection's `schema` and `columns` only)
- `src/lib/content.ts` (the `Artist` type and `getArtists()` only)

**Out of scope** (do NOT touch):

- `scripts/fixtures.mjs` — no fixture change is needed for this plan (see "Current state").
- Any page or component under `src/app/` or `src/components/` — nothing reads `role`/`visitDates` yet; wiring them into the UI is plan 019.
- `content/artists/` — empty except `.gitkeep`; nothing to migrate.
- The `pieces` collection or any other collection/singleton in `keystatic.config.ts`.

## Git workflow

- Branch: `advisor/018-artist-role-field`
- One commit, e.g. `feat(content): add role and visitDates to the artists schema`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the fields to the Keystatic schema

In `keystatic.config.ts`, inside the `artists` collection's `schema` object,
add two fields after `order` (i.e. `order` is no longer the last field):

```ts
        order: fields.integer({
          label: "Order",
          description: "Lower numbers appear first.",
          defaultValue: 100,
        }),
        role: fields.select({
          label: "Role",
          description:
            "Resident (own chair, regular schedule), apprentice, or guest (visiting for a limited window).",
          options: [
            { label: "Resident", value: "resident" },
            { label: "Apprentice", value: "apprentice" },
            { label: "Guest", value: "guest" },
          ],
          defaultValue: "resident",
        }),
        visitDates: fields.text({
          label: "Visiting dates",
          description:
            'Guest artists only — e.g. "Nov 14–16". Leave blank for residents and apprentices.',
        }),
```

Also update `columns: ["name", "order"]` (line 91) to
`columns: ["name", "role", "order"]`, so the role is visible in the
Keystatic admin's collection table.

**Verify**: `grep -n "role: fields.select\|visitDates: fields.text" keystatic.config.ts` shows both. `grep -n 'columns: \["name", "role", "order"\]' keystatic.config.ts` shows one match.

### Step 2: Update `Artist` and `getArtists()` in `src/lib/content.ts`

Add `role` and `visitDates` to the `Artist` type, after `order`:

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

Update `getArtists()` to read both, with the same defensive-default pattern
already used for `order`:

```ts
export const getArtists = cache(async (): Promise<Artist[]> => {
  const entries = await reader.collections.artists.all();
  return entries
    .map(({ slug, entry }) => ({
      slug,
      name: entry.name,
      photo: entry.photo,
      specialties: entry.specialties,
      bio: entry.bio,
      instagram: normalizeInstagramHandle(entry.instagram),
      order: entry.order ?? 100,
      role: entry.role ?? "resident",
      visitDates: entry.visitDates,
    }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
});
```

Do not change the function's sort order (still by `order` then `name`) —
grouping by role happens where the data is _consumed_ (plan 019), not here.

**Verify**: `pnpm exec tsc --noEmit` → exit 0. If `entry.role` or
`entry.visitDates` don't typecheck against the Keystatic reader's inferred
entry type, that means the field names in Step 1 don't match exactly what
you wrote here — re-check for a typo before assuming anything else is wrong.

### Step 3: Full verification

Run `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm format:check` (fix with
`pnpm format` if needed), `pnpm test`.

`pnpm test` seeds the two fixture artists (neither has a `role:` line in
their YAML), builds, and runs the full suite — this confirms the
`entry.role ?? "resident"` fallback works for artists that predate the
field, and that nothing about the existing Artists/Portfolio pages broke
(they don't read `role` yet, so this is really just confirming the schema
change and type change don't break the build).

**Verify**: all four commands exit 0.

## Test plan

No new tests — this plan adds no new user-facing behavior (nothing reads
`role`/`visitDates` yet). The existing `pnpm test` suite is the regression
guard: it must still pass with `getArtists()`'s new shape and the fixture
artists' missing `role:`/`visitDates:` lines falling back correctly. If you
want to manually confirm the fallback, you can log
`(await getArtists())[0].role` somewhere temporarily during development —
but remove any such debug code before committing.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0 and `pnpm format:check` exits 0
- [ ] `pnpm test` exits 0
- [ ] `grep -n "role: fields.select\|visitDates: fields.text" keystatic.config.ts` shows both fields
- [ ] `grep -n "role:\|visitDates:" src/lib/content.ts` shows both in the `Artist` type and in `getArtists()`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts.
- `entry.role` or `entry.visitDates` fail to typecheck against Keystatic's
  reader-inferred entry type in a way that isn't a simple naming mismatch —
  this would mean `fields.select`/`fields.text` infer differently than
  expected, and you should report the actual TypeScript error rather than
  casting around it with `as`.
- `pnpm test` fails anywhere outside what this plan touches — that would
  mean the schema change broke something unrelated, which is unexpected and
  worth flagging rather than silently patching.

## Maintenance notes

- Plan 019 (Artists page restructure — resident/guest split, a guest-inquiry
  section) consumes `role` and `visitDates` directly; it will need at least
  one fixture artist with `role: guest` to test the split, which it adds
  itself (not part of this plan).
- Whether an "Apprentice" label should visibly display anywhere (on the
  artist card, the profile page) is still an open question the owner has not
  settled — this plan only stores the value; it deliberately does not decide
  where or whether it's shown. Don't infer a display decision from the
  existence of this field.
- If the owner later wants a stricter guest-visit _date range_ (start/end
  dates) instead of free text, that's a field-type change
  (`fields.text` → two `fields.date`s or a `fields.object`), not something
  this plan's simple string was meant to preempt — it deliberately mirrors
  the reviewed mock's own free-text `visitDates` field rather than
  over-building a structured date range with no current consumer.
