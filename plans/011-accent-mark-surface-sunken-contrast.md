# Plan 011: Fix `accent-mark`'s failing contrast on `surface-sunken` in light mode

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat bea6c5a..HEAD -- src/styles/roles.css scripts/contrast.mjs`
> If either file changed since this plan was written, compare the "Current
> state" excerpts below against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED (the fix is one line and mechanically safe, but it visibly
  changes the shade of every gold underline, nav indicator, and state mark in
  **light mode only** — see "Why this matters")
- **Depends on**: none (touches `scripts/contrast.mjs`'s `PAIRS` array, the
  same file plan 012 also edits — land one before the other to avoid a merge
  overlap; order doesn't matter which goes first)
- **Category**: bug (accessibility / WCAG)
- **Planned at**: commit `bea6c5a`, 2026-09-29

## Why this matters

`accent-mark` is the role for "gold marks that must read at 3:1: underlines,
state indicators, edges around an accent fill" (see the role-guidance doc
comment at the top of `src/styles/roles.css`). In light mode it is pinned to
`gold-500`, and `scripts/contrast.mjs` carries a comment (lines 10-13)
recording that this fails on `surface-sunken`:

```js
// Known gap, deliberately not listed: in light mode `accent-mark` on
// `surface-sunken` measures 2.63:1, under the 3:1 it needs. Nothing sits on
// `surface-sunken` yet. Add that row, and fix the surface or the role, before
// the first component sits on it.
```

"Nothing sits there yet" is true today, but it's an unenforced comment, not a
guard — nothing stops a future component from putting a gold underline or a
status mark on a sunken surface (a section band, the footer) and silently
shipping a WCAG failure, because `check:contrast` doesn't test the pairing at
all right now. This plan computes an exact fix (verified by hand below, not
guessed) and closes the gap before it can be hit by accident: darkening
`accent-mark` from `gold-500` to `gold-600` in light mode clears 3:1 on
`surface-sunken` with room to spare, while every pairing `accent-mark`
currently *does* pass stays passing with more margin than before (numbers
below). The visible effect is that gold underlines/marks read a shade more
amber/brown in light mode — a real, if subtle, design change, which is why
this is flagged MED risk and worth a human eyeballing `/styleguide` before
merge, not just a green contrast check.

## Current state

- `src/styles/roles.css`, light block:
  ```css
  --accent-mark: var(--gold-500);
  ```
- `src/styles/roles.css`, dark block: `--accent-mark: var(--gold-300);` — dark
  mode is **not** affected by this plan. Dark `surface-sunken` equals
  `background` exactly (both `var(--paper-950)`), so `accent-mark` on
  `surface-sunken` in dark mode already passes trivially (it's the same pixel
  value as the `accent-mark`-on-`background` pairing that's already in
  `PAIRS` and already passes) — do not add a dark-mode row for this pairing,
  it would be redundant.
- Ramp values used below, read from `src/styles/palette.css` (generated,
  unchanged by this plan):
  - `--gold-500: #ac6f00;` (current `accent-mark`, light)
  - `--gold-600: #8a5500;` (proposed `accent-mark`, light)
  - `--paper-50: #f9f7f1;` (`background`, `surface-raised`, `scrim`)
  - `--paper-100: #eeeae1;` (`surface`)
  - `--paper-200: #d1cdc4;` (`surface-sunken`)
- `scripts/contrast.mjs`, `PAIRS` array (lines 51–53 today):
  ```js
  ["accent-mark", "background", 3, "gold underlines, marks, accent-fill edges"],
  ["accent-mark", "surface", 3, "gold marks on surface"],
  ["accent-mark", "surface-raised", 3, "gold marks on a raised surface"],
  ```
  and the "Known gap" comment quoted above at lines 10–13.
- Contrast math (WCAG relative luminance, same formula `scripts/contrast.mjs`
  uses — relative luminance `L`, contrast `= (max(L1,L2)+0.05)/(min(L1,L2)+0.05)`),
  computed by hand against the values above:

  | Pairing (light mode) | `gold-500` (current) | `gold-600` (proposed) | Needs |
  |---|---|---|---|
  | `accent-mark` on `background`/`surface-raised`/`scrim` (`paper-50`) | 3.89 : 1 | 5.79 : 1 | 3 : 1 |
  | `accent-mark` on `surface` (`paper-100`) | ~3.4 : 1 | 5.18 : 1 | 3 : 1 |
  | `accent-mark` on `surface-sunken` (`paper-200`) | **2.63 : 1 (FAIL)** | **3.91 : 1 (PASS)** | 3 : 1 |

  Every pairing that passes today keeps passing after the change, with more
  margin, and the one that fails today passes after the change. This is why
  the fix is "change the pin, not the surface": `gold-600` is a strict
  improvement across every existing use of `accent-mark`, with no new
  failures introduced.

- Repo convention for adding a covered pairing once it passes: `git log
  --oneline -- scripts/contrast.mjs` shows `5719ac6 test(color): measure
  edge, marks and errors on raised and sunken surfaces` added rows for
  newly-supported surfaces the same way this plan does — follow that pattern.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Contrast check | `pnpm check:contrast` | `check-contrast: 70 pairings x 2 themes, all pass.` (69 today + 1 new row = 70) |
| Format | `pnpm format` | exits 0 |
| Lint | `pnpm lint` | exits 0 |
| Build | `pnpm build` | exits 0 |
| Visual check | `pnpm dev`, then open `/styleguide` at both a light and dark OS setting | gold marks/underlines/nav-current indicator are visibly present, slightly deeper/more amber in light mode than before; unchanged in dark mode |

## Scope

**In scope**:
- `src/styles/roles.css` — change `--accent-mark: var(--gold-500);` to
  `--accent-mark: var(--gold-600);` in the **light** block only. Do not touch
  the dark block's `--accent-mark: var(--gold-300);`.
- `scripts/contrast.mjs` — add the `accent-mark` / `surface-sunken` row to
  `PAIRS`; remove the "Known gap" comment (lines 10–13) since the gap is now
  closed and tested.

**Out of scope** (do NOT touch):
- Any other role or ramp pin. In particular, do not touch `--warning`, which
  is separately pinned to `gold-600` already (`--warning: var(--gold-600);`,
  light block) — that's a coincidence of value, not a shared token; leave it
  exactly as is, don't try to "unify" it with `accent-mark`.
- `scripts/color-ramps.mjs` or `palette.css`/`palette.generated.json` — this
  plan repoints a role at an *existing* ramp step; it does not add, remove,
  or change any ramp value, so no regeneration is needed or wanted.
- `figma/manifest.json` — it mirrors `roles.css`, so it **does** need
  regenerating (`pnpm figma-manifest`) as part of landing this, but that's a
  mechanical follow-up, not a scope item to design around; run it after the
  `roles.css` edit and commit the regenerated manifest.
- Dark mode `accent-mark` (`gold-300`) — not in scope, not broken.

## Git workflow

- Branch: `advisor/011-accent-mark-surface-sunken-contrast`
- One commit for the `roles.css` + `contrast.mjs` change, one for the
  regenerated `figma/manifest.json`. Message style: conventional commits,
  e.g. `fix(color): darken accent-mark so it clears 3:1 on surface-sunken`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: repoint `accent-mark` in light mode

In `src/styles/roles.css`, in the light (`:root { ... }`) block, change:

```css
--accent-mark: var(--gold-500);
```

to:

```css
--accent-mark: var(--gold-600);
```

Leave the dark block's `--accent-mark: var(--gold-300);` untouched.

**Verify**: `grep -n "accent-mark" src/styles/roles.css` shows `gold-600` on
the line before the `@media (prefers-color-scheme: dark)` block and
`gold-300` on the line inside it.

### Step 2: close the gap in `scripts/contrast.mjs`

Remove the "Known gap" comment block (the 4 lines starting `// Known gap,
deliberately not listed:`).

Add a new row to `PAIRS`, next to the other `accent-mark` rows (after
`["accent-mark", "surface-raised", 3, "gold marks on a raised surface"],`):

```js
["accent-mark", "surface-sunken", 3, "gold marks on a sunken surface"],
```

**Verify**: `pnpm check:contrast` → `check-contrast: 70 pairings x 2 themes, all pass.`
If it reports a failure on this new row, STOP — it means the hand-computed
numbers in "Current state" don't match the live ramp values (see STOP
conditions).

### Step 3: regenerate the Figma manifest

`pnpm figma-manifest`.

**Verify**: `git diff figma/manifest.json` shows a changed `hash` and the
`accent-mark` role's `light.hex` changing from `ac6f00` to `8a5500` (`ref`
changing from `gold-500` to `gold-600`); no other role or ramp value changes.

### Step 4: gate and eyeball it

`pnpm format`, `pnpm lint`, `pnpm build` — all exit 0.

Then `pnpm dev`, open `/styleguide`, and look at the `accent-mark` swatch and
any live gold underlines/nav-current indicators in both light and dark (use
your browser or OS dark-mode toggle, or DevTools' "Emulate CSS media feature
prefers-color-scheme"). Confirm light mode's gold reads a shade deeper/more
amber than before and nothing looks visually broken.

## Test plan

No new automated test is needed: `pnpm check:contrast` (Step 2's verify) *is*
the regression test for this exact class of bug, and the new `PAIRS` row
means this specific pairing is now covered by CI (`ci.yml` runs
`pnpm check:contrast`) permanently. Do not add a Playwright test for this —
`tests/interactions.spec.ts` already runs axe-core across every route in
`tests/routes.ts` in both color schemes (see its existing `colorScheme` loops
around lines 274 and 304), which will independently catch any contrast
regression in real rendered pages; adding a second, narrower test would be
redundant.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm check:contrast` exits 0 and reports `70 pairings x 2 themes, all pass.`
- [ ] `grep -n "Known gap" scripts/contrast.mjs` returns no matches
- [ ] `grep -n "gold-600" src/styles/roles.css` matches on the light `accent-mark` line
- [ ] `grep -n "gold-300" src/styles/roles.css` still matches on the dark `accent-mark` line (unchanged)
- [ ] `git diff figma/manifest.json` is non-empty and contains `8a5500` (not `ac6f00`) for `accent-mark`'s light hex
- [ ] `pnpm lint` exits 0
- [ ] `pnpm build` exits 0
- [ ] `pnpm test` (the Playwright/axe suite) exits 0
- [ ] `git status` shows changes only in: `src/styles/roles.css`, `scripts/contrast.mjs`, `figma/manifest.json`
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `pnpm check:contrast` reports the new `accent-mark`/`surface-sunken` row as
  failing — it means either `gold-600`, `paper-200`, or the formula has
  drifted from the values hand-computed in "Current state" above. Report the
  actual reported ratio; do not pick a different gold step by trial and
  error without checking why the math disagrees first.
- Any *other* `PAIRS` row starts failing after this change — that would mean
  `accent-mark` is used somewhere this plan didn't account for; report which
  row and its ratio.
- `pnpm test` (Playwright/axe) reports a new violation anywhere — the axe
  sweep tests real rendered pages, which is a stronger check than the
  hand-picked `PAIRS` table; a failure there means a real component uses
  `accent-mark` in a way not modeled above.

## Maintenance notes

- If a future design pass wants gold underlines/marks to read lighter again
  (back toward `gold-500` or `gold-400`) in light mode, `surface-sunken`
  would need to move to a lighter `paper` step first, or `accent-mark`'s use
  on sunken surfaces would need to be explicitly restricted (and that
  restriction would need to be enforced by removing the `PAIRS` row this plan
  adds, not just by convention) — don't silently re-lighten `accent-mark`
  without re-checking this pairing.
- A reviewer should scrutinize the `/styleguide` screenshot/eyeball step
  (Step 4) — this is the one step in this plan that isn't fully
  machine-verified, because "does the new gold look acceptable" is a design
  judgment, not a contrast ratio.
