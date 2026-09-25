# Plan 006: Teach the contrast checker about the sunken and raised surfaces

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 8d2892d..HEAD -- scripts/contrast.mjs scripts/check-contrast.mjs`
> Plan 005 edits note strings in `scripts/contrast.mjs`; that diff is expected.
> Compare the "Current state" excerpts against the live code; on any other
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW (reporting only; the checker never blocks dev or the build)
- **Depends on**: plans/005-gold-highlight-red-for-error-only.md (same file; the numbers below assume plans 003 to 005)
- **Category**: tests
- **Planned at**: commit `8d2892d`, 2026-09-25

## Why this matters

`pnpm check:contrast` (and CI, and the `/styleguide` Color section) measure a
list of foreground/background role pairings, `PAIRS` in `scripts/contrast.mjs`.
It says "all pass" while whole surfaces are unchecked: `accent-edge`, `highlight`,
`error`, `error-text` and `highlight-text` are never measured on
`surface-sunken` (recessed bands and the footer) or `surface-raised` (the nav
pill and menus), even though the project rule is that a gold button's edge and
state marks reach 3:1 wherever they sit. Measuring them turned up one real gap
(below). This plan adds the rows that pass today, so regressions there get caught,
and records the gap in code instead of leaving it invisible.

## Current state

`scripts/contrast.mjs` `PAIRS` is an array of
`[foreground role, background role, minimum WCAG ratio, note]` rows (lines 12-53).
Relevant existing rows:

```js
  ["accent-edge", "background", 3, "border around an accent fill"],
  ["accent-edge", "surface", 3, "accent fill border on surface"],
  ...
  ["highlight", "background", 3, "gold underlines and state marks"],  // wording set by plan 005
  ["highlight", "surface", 3, "gold state marks on surface"],
  ...
  ["error-text", "surface", 4.5, "error message on surface"],
  ["error", "surface", 3, "invalid border on surface"],
```

`scripts/check-contrast.mjs` prints `check-contrast: N pairings x 2 themes, all pass.`
with `N = PAIRS.length` and exits 1 on any failure (CI runs it). It does not need
changing.

Measured with the plan 003 to 005 ramps and roles (light / dark):

| Pairing (foreground on background) | Light | Dark  | Min | Result           |
| ---------------------------------- | ----- | ----- | --- | ---------------- |
| accent-edge on surface-raised      | 3.89  | 6.67  | 3   | pass             |
| highlight-text on surface-sunken   | 5.88  | 12.87 | 4.5 | pass             |
| error-text on surface-sunken       | 5.65  | 6.76  | 4.5 | pass             |
| error on surface-sunken            | 3.68  | 4.89  | 3   | pass             |
| accent-edge on surface-sunken      | 2.63  | 10.05 | 3   | **FAIL (light)** |
| highlight on surface-sunken        | 2.63  | 10.05 | 3   | **FAIL (light)** |

The two failures are real but latent: nothing in the UI sits on `surface-sunken`
yet (the owner is still designing with it and hand-tunes its value in
`roles.css`). Do not "fix" them here, and do not add rows that fail, because CI
runs this checker and would go red.

Convention: one row per pairing, note in plain words, minimums are WCAG 2.2
(4.5 text, 3 for non-text). Match the existing row style.

## Commands you will need

| Purpose        | Command                             | Expected on success                                 |
| -------------- | ----------------------------------- | --------------------------------------------------- |
| Contrast check | `pnpm check:contrast`               | `check-contrast: 49 pairings x 2 themes, all pass.` |
| Format / lint  | `pnpm format:check` and `pnpm lint` | exit 0                                              |
| Full test      | `pnpm test`                         | exit 0                                              |

## Scope

**In scope** (the only file you should modify):

- `scripts/contrast.mjs`

**Out of scope** (do NOT touch):

- `src/styles/roles.css` and every role value. The owner decides how to resolve
  the two known misses when they design with `surface-sunken`.
- `scripts/check-contrast.mjs`, `figma/manifest.json` (no role or ramp changes here).
- Adding the two failing rows.

## Git workflow

- Branch: `advisor/006-contrast-pairings`
- One commit, e.g. `test(color): measure edge, marks and errors on raised and sunken surfaces`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Baseline

Run `pnpm check:contrast`.

**Verify**: `check-contrast: 45 pairings x 2 themes, all pass.` If plans 003 to 005
have not all landed, STOP: the table above was measured against them.

### Step 2: Add the four passing rows

Insert these rows in `PAIRS`, each next to its siblings (edge rows after the
existing `accent-edge` rows, and so on):

```js
  ["accent-edge", "surface-raised", 3, "accent fill border on a raised surface"],
  ["highlight-text", "surface-sunken", 4.5, "gold as text on a sunken surface"],
  ["error-text", "surface-sunken", 4.5, "error message on a sunken surface"],
  ["error", "surface-sunken", 3, "invalid border on a sunken surface"],
```

**Verify**: `pnpm check:contrast` prints
`check-contrast: 49 pairings x 2 themes, all pass.`

### Step 3: Record the known misses in code

Above the `PAIRS` array (or right after the `accent-edge` rows) add a comment,
in the file's existing comment style, that says: in light mode `accent-edge` and
`highlight` on `surface-sunken` measure 2.63:1 (under 3:1); nothing uses
`surface-sunken` yet; add those two rows, and fix the surface or the roles, before
the first component sits on it.

**Verify**: `git diff --stat` shows only `scripts/contrast.mjs`; the diff adds 4 rows
and a comment and removes nothing.

### Step 4: Format, lint, test

Run `pnpm format:check`, `pnpm lint`, `pnpm test`.

**Verify**: all exit 0. Optionally open `/styleguide` and confirm the contrast
table now lists the new rows.

## Test plan

The change is itself test coverage. Its regression check is the checker
run: 49 pairings, all pass. To prove a new row can fail, temporarily (do not
commit) change one row's minimum to 20 and confirm `pnpm check:contrast` exits 1
naming that row, then revert.

## Done criteria

- [ ] `pnpm check:contrast` prints `49 pairings x 2 themes, all pass.`
- [ ] The comment recording the two known light-mode misses exists in `scripts/contrast.mjs`
- [ ] `pnpm format:check`, `pnpm lint`, `pnpm test` exit 0
- [ ] Only `scripts/contrast.mjs` modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any of the four new rows fails on your checkout (the ramps or roles differ from
  the table): report the measured ratios, do not change roles.
- You are tempted to add the two failing rows or change `surface-sunken` to make
  them pass. Report instead.
- `PAIRS` has a different shape from the excerpt.

## Maintenance notes

- When the owner starts using `surface-sunken` (footer, section bands), add the two
  deferred rows and resolve the light-mode gap then. The realistic options: a
  lighter light-mode sunken (but it approaches `surface`), a deeper gold step for
  `accent-edge`/`highlight` on that surface, or a scoped override on the band.
- New roles (a `success`, flash red and green) need their pairings added here in
  the same change that introduces them.
