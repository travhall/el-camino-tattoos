# Plan 015: Switch every rounded corner to sharp (0 radius)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 247a87d..HEAD -- src/styles/components.css src/styles/layout.css src/styles/styleguide.css scripts/figma-manifest.mjs figma/manifest.json`
> Compare the "Current state" excerpts against the live code before
> proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction (design-system change, owner-approved)
- **Planned at**: commit `247a87d`, 2026-09-30

## Why this matters

The owner reviewed a design mock (an agent-generated tattoo-shop site built
to the project's "American traditional, refined" brief) and approved porting
its shape language: sharp corners everywhere, no rounding. Today the site
mixes `rounded-full` (buttons, theme toggle, filter chips, skip link) and
`rounded-md` (form controls, alert box, and a few `/styleguide`-only
elements) with no shared radius token — each component hardcodes its own
Tailwind radius utility. This plan flips every one of them to `rounded-none`
and updates the one place radius is tracked outside CSS
(`scripts/figma-manifest.mjs`), so the shape language is consistent
site-wide and the Figma mirror doesn't drift.

No new radius token is introduced. The site now has exactly one radius
(none), so a shared `--radius-*` variable would be an abstraction with
nothing to vary — see `CLAUDE.md`'s own rule against adding tokens before
there's a second value that needs one. If the owner later wants a
per-component radius again, that's a follow-up, not part of this plan.

## Current state

Every `rounded-*` utility in the codebase (confirmed via
`grep -rn "rounded-" src/ --include="*.css" --include="*.tsx" --include="*.ts"`
— there are no `rounded-*` classes in any `.tsx`/`.ts` file; all of them live
in the three CSS files below, inside `@apply` rules, per the project's
"utilities in CSS, not JSX" convention):

`src/styles/components.css`:
- Line 76, `.button`: `...rounded-full border border-button-primary-border...`
- Line 105, `.theme-toggle`: `...rounded-full border border-outline...`
- Line 146, `.filter-chip`: `...rounded-full border border-chip-border...`
- Line 231, `.field__control`: `...rounded-md border border-outline...`
- Line 268, `.form-status`: `...rounded-md border border-error...`

`src/styles/layout.css`, line 14, `.skip-link`:
```css
@apply not-sr-only fixed top-fluid-sm left-fluid-sm z-50 rounded-full bg-foreground px-fluid-md py-fluid-xs font-medium text-background;
```

`src/styles/styleguide.css` (`/styleguide` only, but per CLAUDE.md "new UI
goes in `/styleguide` first" — it should demonstrate real conventions, so it
gets the same treatment):
- Line 6 (the page's sticky section nav): `...rounded-md border border-line bg-surface-raised...`
- Line 40 (a ramp-swatch box): `...h-20 rounded-md border border-line;`
- Line 73 (a type-scale demo bar): `...block h-3 rounded-full bg-accent;`
- Line 102 (a motion-demo box): `...relative flex h-40 items-end overflow-hidden rounded-md border border-line;`

`scripts/figma-manifest.mjs`, lines 73–77 (the `layout` object passed to the
manifest writer):
```js
  "radius/control": {
    px: 6,
    source: ".field__control, .form-status (rounded-md)",
  },
  "radius/pill": { px: 9999, source: ".filter-chip, .button (rounded-full)" },
```
These become a single `radius/sharp` entry at `px: 0`, listing every
consumer above (both the ones currently under `radius/control` and
`radius/pill`, plus `.theme-toggle` and `.skip-link`, which were never
tracked as manifest values before but should be now that there's one
canonical radius). `figma/manifest.json` has the generated twin of this
object (lines 788–795) — do not hand-edit it; `pnpm figma-manifest`
regenerates it.

Nothing else references corner radius: no component in `src/components/`
applies its own `rounded-*`, and there is no existing `--radius` CSS custom
property anywhere in `src/styles/`.

## Commands you will need

| Purpose        | Command                                      | Expected on success |
| --------------- | --------------------------------------------- | -------------------- |
| Typecheck      | `pnpm exec tsc --noEmit`                      | exit 0, no output    |
| Lint           | `pnpm lint`                                    | exit 0                |
| Format         | `pnpm format:check` (fix with `pnpm format`)   | exit 0                |
| Figma manifest | `pnpm figma-manifest`                          | prints a new `hash` (a tracked value changed) |
| Tests          | `pnpm test` (seeds fixtures, builds, runs Playwright) | all pass |

Use `pnpm` only.

## Scope

**In scope** (the only files you should modify):

- `src/styles/components.css` (the 5 rules listed above, `rounded-*` only — no other property changes)
- `src/styles/layout.css` (`.skip-link` only)
- `src/styles/styleguide.css` (the 4 rules listed above)
- `scripts/figma-manifest.mjs` (the `radius/control` / `radius/pill` entries)
- `figma/manifest.json` (regenerated by `pnpm figma-manifest`, never hand-edited)

**Out of scope** (do NOT touch):

- `src/styles/palette.css`, `type-scale.css`, and their `*.generated.json` — unrelated, generated, never hand-edited.
- `src/styles/roles.css` — no color role is affected by a radius change.
- Any `aspect-*` or `overflow-hidden` on image containers (`.piece-tile__media`, `.artist-card__media`, etc.) — these already have no radius; leave them as is.
- Plans 016 and 017 (dark-mode default, homepage hero) — independent of this one; do not start them here.

## Git workflow

- Branch: `advisor/015-sharp-corners`
- One commit, e.g. `feat(design): switch corners to sharp site-wide`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Flip every `rounded-*` utility to `rounded-none`

In each of the three CSS files, replace `rounded-full` and `rounded-md` with
`rounded-none` in exactly the 9 rules listed in "Current state" (5 in
`components.css`, 1 in `layout.css`, 4 in `styleguide.css`, wherever they
appear inside an `@apply` list). Change nothing else on those lines — same
class order otherwise, same every other utility.

**Verify**: `grep -rn "rounded-full\|rounded-md" src/styles/` returns no matches. `grep -c "rounded-none" src/styles/components.css src/styles/layout.css src/styles/styleguide.css` shows `5`, `1`, `4` respectively.

### Step 2: Update the Figma manifest source

In `scripts/figma-manifest.mjs`, replace the `"radius/control"` and
`"radius/pill"` entries (lines 73–77) with one entry:

```js
  "radius/sharp": {
    px: 0,
    source:
      ".button, .theme-toggle, .filter-chip, .field__control, .form-status, .skip-link (rounded-none, site-wide)",
  },
```

Keep its position in the `layout` object where the old two entries were
(after `size/target-min`, before `border/width`).

**Verify**: `grep -n "radius/" scripts/figma-manifest.mjs` shows exactly one match, `radius/sharp`.

### Step 3: Regenerate the manifest

Run `pnpm figma-manifest`. It writes `figma/manifest.json` with a new hash
(prettified automatically, per the script's own `postbuild` step — do not
run Prettier on it separately).

**Verify**: `grep -n "radius/" figma/manifest.json` shows one `radius/sharp` entry with `"px": 0`. `git diff figma/manifest.json` shows only the `radius/*` keys and the top-level `hash` changed — no other values moved.

### Step 4: Full verification

Run, in order: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm format:check`
(fix with `pnpm format` if it fails, then re-run `format:check`), `pnpm test`.

`pnpm test` includes the full axe sweep on every route in light and dark at
phone and desktop widths, plus the 44px touch-target test — a radius change
does not affect element dimensions, so no test should need updating, but a
failure here means something unexpected happened; do not weaken a test to
make it pass.

**Verify**: all four commands exit 0.

## Test plan

No new tests — this is a pure visual property with no behavioral surface.
The existing `pnpm test` suite (axe sweep + touch-target test) is the
regression guard: if sharpening corners somehow changed a computed size or
tripped an accessibility rule, it will fail there. If you want to eyeball
it, run `pnpm dev`, open `/styleguide`, and confirm buttons, the filter-chip
demo, and form controls all render with square corners in both themes.

## Done criteria

- [ ] `grep -rn "rounded-full\|rounded-md" src/styles/` returns no matches
- [ ] `grep -n "radius/" scripts/figma-manifest.mjs figma/manifest.json` shows exactly one `radius/sharp` entry in each, at `px: 0` / `"px": 0`
- [ ] `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm format:check`, `pnpm test` all exit 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any of the 9 rules listed in "Current state" doesn't match the live code (report the actual content; do not guess which lines to change).
- A `rounded-*` utility shows up somewhere this plan didn't account for (e.g. inside a `.tsx` file, contradicting the "utilities in CSS only" convention) — report it rather than silently changing it; that may indicate the convention has already drifted and needs the owner's attention.
- `pnpm figma-manifest` fails or produces an unexpected diff beyond the `radius/*` keys and the hash.
- The axe sweep or touch-target test fails after this change — radius should never affect either, so a failure means something else is wrong; report the failing test rather than adjusting it.

## Maintenance notes

- Any new component with a border should default to `rounded-none` (or no
  radius utility at all, which is the same thing) to stay consistent — there
  is no longer a "default" Tailwind radius anywhere in this codebase's
  conventions.
- If a future design pass wants radius variation again (e.g. one rounded
  accent element against an otherwise-sharp site), that is the point to
  introduce a real `--radius-*` token layer analogous to the spacing/type
  scale — don't add one preemptively now that there's only one value.
- After this lands, the Figma file is stale: the owner re-syncs Figma from
  the new `figma/manifest.json` hash. Do not use any Figma tool yourself.
