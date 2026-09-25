# Plan 004: Warm the dark end of the gold ramp so it reads amber, not olive

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 8d2892d..HEAD -- scripts/color-ramps.mjs src/styles/palette.css src/styles/palette.generated.json figma/manifest.json`
> Plan 003 edits the same generator and generated files; if it has already
> landed, that diff is expected. Compare the "Current state" excerpts against
> the live code and proceed only if `buildRamp` still matches. Any other
> mismatch is a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW (opt-in generator option; only the gold ramp opts in)
- **Depends on**: plans/003-cool-paper-and-neutral-ink-pins.md (same generator and generated files; serialize to avoid conflicts)
- **Category**: direction
- **Planned at**: commit `8d2892d`, 2026-09-25

## Why this matters

The gold ramp holds one hue (about 82) from its pinned brand step (300,
`#e9ac1f`) down to near-black. Darker yellows at a constant hue read as olive and
mustard, so `accent-hover` (`gold-400`, `#c69000`), `accent-edge` (`gold-500`,
`#a27500`) and `accent-text` (`gold-700`, `#5f4300`) look muddy next to the
bright gold fill. Real tattoo-flash gold shifts toward orange as it darkens.
This plan adds an opt-in `darkHue` option to the generator so a ramp's hue can
drift toward a target as it darkens past its last pin, and turns it on for gold
only. Every other ramp must come out byte-identical.

## Current state

`scripts/color-ramps.mjs` `buildRamp` (function starts at line 115). The branch
that generates steps darker than the last pin is at lines 145-149; hue is held:

```js
function buildRamp({ pins }) {
  const pinned = Object.entries(pins)
  ...
    if (index > last.index) {
      const t = (index - last.index) / (lastIndex - last.index);
      L = last.L + (DARKEST - last.L) * t;
      C = last.C * (1 - 0.35 * t);
      h = last.h;
    } else {
```

(`h` is in radians throughout; `last.h` comes from `rgbToOklch`.) The gold entry
today (`scripts/color-ramps.mjs`, in `ramps`):

```js
  // Mustard gold: primary actions. Sits high in lightness, so it lives at 300.
  gold: { pins: { 300: "#e9ac1f" } },
```

Roles that point at gold steps (`src/styles/roles.css`, read-only here): light
`accent` gold-300, `accent-hover` gold-400, `accent-edge` gold-500, `accent-text`
gold-700, `accent-soft` gold-100; dark `accent-hover` gold-200, `accent-edge`
gold-300, `accent-text` gold-200, `accent-soft` gold-900.

Conventions (from `CLAUDE.md`): never hand-edit `palette.css`,
`palette.generated.json` or `figma/manifest.json`; regenerate with
`pnpm color-ramps` and `pnpm figma-manifest`. Keep ramps smooth; the generator
prints `... ramp is uneven ...` if lightness steps lurch, and that must not appear.

## Commands you will need

| Purpose          | Command                              | Expected on success                                         |
| ---------------- | ------------------------------------ | ----------------------------------------------------------- |
| Regenerate ramps | `pnpm color-ramps`                   | prints `color-ramps: 6 ramps written.`, no "uneven" warning |
| Contrast check   | `pnpm check:contrast`                | `check-contrast: 45 pairings x 2 themes, all pass.`         |
| Figma manifest   | `pnpm figma-manifest`                | prints a `hash`                                             |
| Format / lint    | `pnpm format:check` and `pnpm lint`  | exit 0                                                      |
| Full test (slow) | `pnpm test`                          | exit 0                                                      |
| Dev server       | `pnpm dev` (then open `/styleguide`) | Buttons and Color sections render                           |

## Scope

**In scope** (the only files you should modify):

- `scripts/color-ramps.mjs`
- `src/styles/palette.css` (generated)
- `src/styles/palette.generated.json` (generated)
- `figma/manifest.json` (generated)

**Out of scope** (do NOT touch):

- `src/styles/roles.css` and every component. Role changes are another plan.
- The `paper`, `ink`, `red`, `green`, `navy` ramps: they must not gain `darkHue`
  and must not change.
- Do not change gold's pin (`#e9ac1f`) or add pins.

## Git workflow

- Branch: `advisor/004-gold-hue-drift`
- One commit, conventional-commit style, e.g.
  `feat(color): drift the gold ramp toward amber as it darkens`.
- Do NOT push or open a PR unless the operator instructed it.
- On a conflict in the generated files, do not hand-merge: keep your
  `color-ramps.mjs`, then re-run `pnpm color-ramps` and `pnpm figma-manifest`.

## Steps

### Step 1: Baseline

Run `pnpm check:contrast`, then save the current gold ramp for comparison:
`grep -- "--gold-" src/styles/palette.css > /tmp/gold-before.txt`
(a scratch file outside the repo; use your scratchpad directory if one is set).

**Verify**: contrast prints all pass; the file has 11 lines.

### Step 2: Add the `darkHue` option

In `scripts/color-ramps.mjs`:

1. Change the signature to `function buildRamp({ pins, darkHue }) {`.
2. In the `index > last.index` branch replace `h = last.h;` with an ease-out drift
   toward `darkHue` (degrees, optional; when omitted the hue is held exactly as
   before):

```js
// Optional: drift toward darkHue (degrees) as the ramp darkens, fast at
// first then settling, so darker steps warm instead of going olive.
h =
  darkHue === undefined
    ? last.h
    : last.h + ((darkHue * Math.PI) / 180 - last.h) * (1 - (1 - t) ** 2);
```

3. Document the option in the comment block above `const ramps`: one or two
   lines saying a ramp may set `darkHue` (degrees) to drift hue past its last pin.
4. Set gold to opt in (keep its pin and update the comment):

```js
  // Mustard gold: primary actions. Sits high in lightness, so it lives at 300.
  // Its hue drifts toward amber (62) as it darkens, so hover, edge and text steps
  // read as gold-brown rather than olive.
  gold: { pins: { 300: "#e9ac1f" }, darkHue: 62 },
```

**Verify**: `git diff --stat` shows only `scripts/color-ramps.mjs`.

### Step 3: Regenerate and confirm only gold moved

Run `pnpm color-ramps`.

**Verify**:

- output `color-ramps: 6 ramps written.`, no `is uneven` line;
- `grep -- "--gold-" src/styles/palette.css` gives exactly:

```
  --gold-50: #fff8ea;
  --gold-100: #ffe2af;
  --gold-200: #f9c666;
  --gold-300: #e9ac1f;
  --gold-400: #cc8c00;
  --gold-500: #ac6f00;
  --gold-600: #8a5500;
  --gold-700: #693c00;
  --gold-800: #492600;
  --gold-900: #2a1300;
  --gold-950: #100200;
```

(Steps 50 to 300 are unchanged from before.) If any value differs, STOP.

- `git diff -U0 src/styles/palette.css | grep -E '^[+-]  --' | grep -v -- '--gold-'`
  prints nothing (no other ramp changed). Because plan 003 may have landed on the
  same base, compare against your own baseline, not against `8d2892d`.

### Step 4: Contrast, manifest, full verification

Run `pnpm check:contrast`, `pnpm figma-manifest`, `pnpm format:check`,
`pnpm lint`, `pnpm test`.

**Verify**: contrast all pass (simulated against these exact values with zero
failures); the others exit 0. Note the new manifest hash for your report.

### Step 5: Look at it once

Run `pnpm dev`, open `/styleguide`, and view the Buttons section (hover the
primary button) in light mode. Report before and after values for `accent-hover`
(`#c69000` to `#cc8c00`), `accent-edge` (`#a27500` to `#ac6f00`) and `accent-text`
(`#5f4300` to `#693c00`). Do not tune `darkHue` yourself; the owner will.

**Verify**: page renders with no console errors. A screenshot in your report is
welcome.

## Test plan

No new tests: token values only. `pnpm check:contrast` and the existing axe
color-contrast pass in `pnpm test` cover regressions.

## Done criteria

- [ ] `grep -- "--gold-" src/styles/palette.css` matches the table in Step 3
- [ ] No other ramp changed (Step 3 grep prints nothing)
- [ ] `pnpm check:contrast` all pass; `pnpm format:check`, `pnpm lint`, `pnpm test` exit 0
- [ ] `darkHue` appears only on the gold entry (`grep -n darkHue scripts/color-ramps.mjs`)
- [ ] Only the four in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `buildRamp` doesn't match the excerpt (lines 145-149 area).
- Any non-gold ramp value changes, or a generated gold step differs from the table.
- `pnpm color-ramps` warns a ramp is uneven, or contrast/axe fails.
- You want to change `darkHue` or add pins to make it look better. Report instead.

## Maintenance notes

- `darkHue: 62` is a starting value; the ease-out curve makes gold-400 and
  gold-500 warm noticeably (hue about 76 and 71) while 700 to 900 settle near 60.
  A linear drift barely moved gold-400, which is why the curve eases out.
- `gold-950` is hue-clipped by the sRGB gamut, so its computed hue is not
  meaningful; it is near-black and unused by roles.
- If red or green ever need the same treatment, the option works on any ramp.
- Reviewer focus: confirm no other ramp changed, and eyeball the gold button's
  hover and edge in both modes.
