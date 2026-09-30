# Plan 012: Give `subtle` real differentiation from `muted` in dark mode

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat bea6c5a..HEAD -- src/styles/roles.css scripts/contrast.mjs src/app/(site)/styleguide/page.tsx`
> If any changed since this plan was written, compare the "Current state"
> excerpts below against the live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW (no live component currently uses `subtle` — see "Current
  state" — so there is no visual regression surface; the only consumer is the
  `/styleguide` documentation page)
- **Depends on**: none, but touches `scripts/contrast.mjs`'s `PAIRS` array,
  the same file plan 011 also edits — land one before the other to avoid a
  merge overlap; order doesn't matter which goes first
- **Category**: tech-debt (design-token completeness)
- **Planned at**: commit `bea6c5a`, 2026-09-29

## Why this matters

`roles.css`'s own guidance comment describes three text tiers — `foreground`,
`muted`, `subtle` — but `subtle` is pinned to the exact same ramp step as
`muted` in both themes (confirmed below): it is an alias, not a real third
tier, and a code comment says so explicitly. This plan makes `subtle`
genuinely distinct **in dark mode**, where the math shows there's real
headroom to do it without breaking any WCAG guarantee. Light mode cannot be
fixed the same way without a separate, larger design decision (changing the
`surface-sunken` surface itself) — this plan computes exactly why, documents
it precisely (replacing a vague "no lighter ink step works" comment with the
actual numbers) instead of pretending the constraint doesn't exist, and
leaves light mode as an intentional, well-documented alias rather than a
silent placeholder.

## Current state

- `src/styles/roles.css` today:
  - Light block: `--subtle: var(--ink-700);` with the comment `/* subtle
starts equal to muted: no lighter ink step reads 4.5:1 on surface-sunken
*/` (line 78-79). `--muted: var(--ink-700);` is the same value.
  - Dark block: `--muted: var(--ink-300);` and `--subtle: var(--ink-300);` —
    also identical.
  - `subtle` appears in `scripts/contrast.mjs`'s `PAIRS` array against five
    surfaces: `background`, `surface`, `surface-raised`, `surface-sunken`,
    `scrim` (all at 4.5:1, "third-tier text").
- Nobody in `src/` uses `text-subtle` or the `subtle` role in a real
  component today (`grep -rn "text-subtle\|subtle" src/styles/components.css
src/app` returns exactly one hit: `src/app/(site)/styleguide/page.tsx:25`,
  the documentation table `{ name: "subtle", note: "third-tier text, photo
labels" }`). This is a token being designed before its first real use, not
  a live regression risk.
- Ramp values (`src/styles/palette.css`, unchanged by this plan):
  - `--ink-300: #adafb3;` (current dark `muted`/`subtle`)
  - `--ink-400: #929599;` (proposed dark `subtle`)
  - `--paper-800: #33302a;` (dark `surface-raised`)
  - `--paper-900: #1d1a15;` (dark `surface`)
  - `--paper-950: #090704;` (dark `background`, `surface-sunken`, `scrim` —
    all three are the _same_ pinned value in dark mode today, a separate,
    already-documented gap: see `plans/README.md`'s "Not planned" section,
    "Dark-mode `surface-sunken` equals `background`")
- Contrast math (WCAG relative luminance, same formula as `scripts/contrast.mjs`),
  computed by hand:

  | Candidate for dark `subtle`    | vs `surface-raised` (`paper-800`, hardest dark surface) | vs `surface`/`background`/`surface-sunken`/`scrim` | Needs   |
  | ------------------------------ | ------------------------------------------------------- | -------------------------------------------------- | ------- |
  | `ink-300` (current, = `muted`) | 5.99 : 1                                                | 6.7–9.2 : 1                                        | 4.5 : 1 |
  | `ink-400` (proposed)           | **4.36 : 1 (FAIL, just under)**                         | 6.7–6.9 : 1 (pass)                                 | 4.5 : 1 |
  | `ink-500`                      | 3.09 : 1 (fail)                                         | fails on multiple surfaces                         | 4.5 : 1 |

  `ink-400` is the _only_ step darker than `muted`'s `ink-300` that comes
  close: it passes against every dark surface `subtle` needs to support
  **except** `surface-raised` (4.36:1, just under 4.5:1). There is no ramp
  step between `ink-300` and `ink-400` to split the difference (the ramp's
  fixed steps are 50/100/200/…/900/950 — see `scripts/color-ramps.mjs`'s
  `STEPS` constant — there is no "ink-350").

  Checking real usage against this one failing pairing: `surface-raised` is
  documented as "elements that float above the page: nav pill, menus"
  (`roles.css`'s top comment) — not a place third-tier captions, footer
  links, or photo labels (the role's own stated use cases) would ever
  realistically sit. No component uses `subtle` at all today (see above), so
  nothing currently relies on the `subtle`/`surface-raised` guarantee. This
  plan's proposal is to **narrow the contract**: drop the
  `subtle`/`surface-raised` pairing from `PAIRS` (documenting why, the same
  way the accent-mark/surface-sunken gap was documented before plan 011
  closed it) and use `ink-400` for dark `subtle`, which then cleanly passes
  every surface it's actually meant for (background, surface, surface-sunken,
  scrim).

  Light mode: the wall is `ink-600` (`#606367`) failing 4.5:1 against
  `surface-sunken` (`paper-200`) at 3.80:1 — a real, non-marginal fail (see
  `plans/README.md`'s existing note on this). Unlike the dark-mode
  `surface-raised` case, `surface-sunken` **is** a documented real use for
  `subtle` ("footer links" sit on the footer, which is `surface-sunken`), so
  the same "narrow the contract" move isn't available in light mode without
  giving up an intended, real use case. Closing this would require lightening
  `surface-sunken` itself (a separate design decision affecting every band
  and the footer, not just this role) — out of scope for this plan; see STOP
  conditions and Maintenance notes.

## Commands you will need

| Purpose        | Command               | Expected on success                                                                                                                                                                                                              |
| -------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contrast check | `pnpm check:contrast` | reports `69 pairings x 2 themes, all pass.` (70 rows minus the 1 dropped `surface-raised` row = 69 — coincidentally the same count as before this plan; if you land plan 011 first, start from 70 and expect 69 after this plan) |
| Format         | `pnpm format`         | exits 0                                                                                                                                                                                                                          |
| Lint           | `pnpm lint`           | exits 0                                                                                                                                                                                                                          |
| Build          | `pnpm build`          | exits 0                                                                                                                                                                                                                          |

## Scope

**In scope**:

- `src/styles/roles.css` — dark block only: change `--subtle: var(--ink-300);`
  to `--subtle: var(--ink-400);`. Replace the light-mode comment on line 78
  with a more precise one (see Step 1). Leave light `--subtle: var(--ink-700);`
  unchanged.
- `scripts/contrast.mjs` — remove the `["subtle", "surface-raised", 4.5, ...]`
  row from `PAIRS`; add a one-line comment above the remaining `subtle` rows
  explaining the removal (see Step 2).
- `src/app/(site)/styleguide/page.tsx` — no code change needed, but re-check
  its rendered output after this change (its `subtle` swatch note already
  says "third-tier text, photo labels", which stays accurate).

**Out of scope** (do NOT touch):

- Light mode's `--subtle` value — this plan does not attempt to differentiate
  it from `muted`; see "Why this matters" for the documented reason
  (`surface-sunken` would need to change, which is a design decision for the
  project owner, not this plan).
- `--surface-sunken` in either theme, and `--surface-raised` in either theme
  — this plan works within the existing surface ladder, it does not change
  any surface.
- Any component file. `subtle` has no current consumer; this plan does not
  add one (don't "demonstrate" the new tier by wiring it into a component —
  that's a separate, design-led change).
- `scripts/color-ramps.mjs` / `palette.css` / `palette.generated.json` — this
  plan repoints a role at an existing ramp step; no ramp value changes.

## Git workflow

- Branch: `advisor/012-subtle-text-tier-dark-differentiation`
- One commit. Message style: conventional commits, e.g. `fix(color): give
dark-mode subtle its own ink step, separate from muted`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: differentiate `subtle` in dark mode, document the light-mode wall precisely

In `src/styles/roles.css`, dark block, change:

```css
--subtle: var(--ink-300);
```

to:

```css
--subtle: var(--ink-400);
```

In the light block, replace the existing comment:

```css
/* subtle starts equal to muted: no lighter ink step reads 4.5:1 on surface-sunken */
--subtle: var(--ink-700);
```

with:

```css
/* Light mode: subtle stays equal to muted. ink-600 (the next step lighter)
   measures 3.80:1 on surface-sunken, under the 4.5:1 subtle needs there, and
   there is no intermediate ramp step. Dark mode differentiates subtle from
   muted instead (ink-400 vs ink-300) because the same wall doesn't exist
   there. Fixing light mode would mean lightening surface-sunken itself,
   which affects every section band and the footer — a design call, not a
   token tweak. See plans/012-subtle-text-tier-dark-differentiation.md. */
--subtle: var(--ink-700);
```

**Verify**: `grep -n "ink-400" src/styles/roles.css` shows the dark `subtle`
line; `grep -n "ink-700" src/styles/roles.css` still shows the light `subtle`
and `muted` lines unchanged.

### Step 2: narrow the `PAIRS` contract in `scripts/contrast.mjs`

Remove this line from `PAIRS`:

```js
["subtle", "surface-raised", 4.5, "third-tier text on a raised surface"],
```

Add a comment directly above the remaining `subtle` rows explaining why:

```js
// `subtle` is not guaranteed against `surface-raised` (nav pill, menus):
// dark-mode ink-400 measures 4.36:1 there, just under 4.5:1, and
// surface-raised isn't one of subtle's real use cases (captions, footer
// links, photo labels). If a future component needs subtle text on a raised
// surface, use `muted` there instead, or re-open
// plans/012-subtle-text-tier-dark-differentiation.md.
```

**Verify**: `pnpm check:contrast` → `check-contrast: 69 pairings x 2 themes,
all pass.` (if you land this before plan 011: 70 minus 1 = 69; if after plan
011's 70, same math — either order nets 69 once both are landed, but check
the actual printed count against whichever plans have already landed rather
than assuming).

## Test plan

No new automated test: this is the same situation as plan 011 — the value is
covered by the `PAIRS` table (now more accurately scoped) and by
`pnpm check:contrast`, which CI already runs. Because no component currently
renders `subtle`, there is nothing for the Playwright/axe suite
(`tests/interactions.spec.ts`) to newly exercise; do not add a test that
fabricates a `subtle` usage just to test it — that would test a
never-shipped scenario.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm check:contrast` exits 0, reports all pass, with a count that is
      69 if this is the only one of plans 010/011/012 landed, or one more
      than whatever plan 011 already reported if 011 landed first
- [ ] `grep -n '"subtle", "surface-raised"' scripts/contrast.mjs` returns no matches
- [ ] `grep -n "ink-400" src/styles/roles.css` matches the dark `--subtle` line
- [ ] `grep -c "ink-700" src/styles/roles.css` is unchanged from before this plan (light `subtle`/`muted` untouched)
- [ ] `pnpm lint` exits 0
- [ ] `pnpm build` exits 0
- [ ] `pnpm test` exits 0
- [ ] `git status` shows changes only in: `src/styles/roles.css`, `scripts/contrast.mjs`
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `pnpm check:contrast` reports the dark `subtle` role failing against
  `background`, `surface`, `surface-sunken`, or `scrim` — the hand-computed
  numbers above assumed today's ramp values; if the ramp has changed (see
  drift check), the specific ink step that clears every surface may no
  longer be `ink-400`. Do not pick a different step by trial and error;
  recompute against the live `palette.generated.json` values and report the
  new numbers before changing anything.
- Anyone asks you to also "fix" light mode as part of this plan — don't.
  That requires changing `surface-sunken`, which is explicitly out of scope
  (see "Why this matters" and Maintenance notes); report back that it needs
  a separate decision rather than expanding this plan's diff.
- You find an actual component using `subtle` on `surface-raised` that this
  plan's recon missed — that would mean removing the `PAIRS` row breaks a
  real guarantee; report the component and location instead of removing the
  row.

## Maintenance notes

- If the project owner later wants `subtle` genuinely lighter than `muted`
  in **light** mode too (matching the conventional "tertiary = lower
  emphasis" direction), the only paths are: (a) lighten `surface-sunken`
  itself and re-verify every other role that touches it (`muted`, `outline`,
  `accent-mark` per plan 011, `error`/`success`/`warning` families, `focus`),
  or (b) add an intermediate ramp step to `scripts/color-ramps.mjs`'s
  `STEPS` array (e.g. a step between 600 and 700) and re-run
  `pnpm color-ramps`, which ripples into Figma (`pnpm figma-manifest`) and
  the CLAUDE.md documentation of the step scale. Both are real design
  decisions for the project owner, not a follow-up to rubber-stamp.
- If a component later wants to put third-tier text on `surface-raised`
  (nav pill, menus) specifically, use `muted` there, not `subtle` — the
  `PAIRS` comment this plan adds says so; don't silently re-add the
  `surface-raised` row without re-verifying the contrast holds for whatever
  ink step `subtle` uses at that time.
