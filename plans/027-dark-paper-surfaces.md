# Plan 027: Match the mock's dark surfaces (roles.css, no ramp change)

**Planned at:** commit `ddc0f17`, 2026-10-01

**Executor preamble:** Read this entire plan before touching anything. Run
the drift check first. If it reports any difference, STOP and report back.

**Drift check:**

```bash
git diff --stat ddc0f17..HEAD -- src/styles/roles.css scripts/color-ramps.mjs src/styles/palette.css
```

Expected output: nothing.

## Status

TODO

## Why this matters

The design mock (`/Users/travishall/Projects/El Caminio Tattoo/el-camino-tattoo-website-design-DARK/src/index.css`, `:root` block) builds its dark mode from a
tight set of warm charcoals. The project's paper ramp has a hole at the dark
end: the page background in the mock sits between two ramp steps, so no
existing step matches it.

Measured (OKLCH lightness, hue ~80-90, chroma < 0.01):

| Surface (mock)                  | Mock hex  | Mock L | Nearest project step  | Project L |
| ------------------------------- | --------- | ------ | --------------------- | --------- |
| Chrome (topbar, footer)         | `#0c0b09` | 15.0   | `paper-950` `#090704` | 13.0      |
| Page background                 | `#141311` | 18.7   | between 950 and 900   | 13.0/21.8 |
| Elevated surface (cards, bands) | `#1d1b18` | 22.3   | `paper-900` `#1c1a15` | 21.8      |
| Raised / thumb                  | `#221f1b` | 24.1   | `paper-900` or `800`  | 21.8/30.7 |
| Rule (dividers)                 | `#34302a` | 31.1   | `paper-800` `#322f2a` | 30.7 ✓    |
| Rule-strong (borders)           | `#4f483e` | 40.5   | `paper-700` `#494641` | 39.5 ✓    |

So `line` and `border` already match. The page background, surfaces and chrome
do not: our page is darker (L13) than the mock (L18.7), and our jump from
page to card is 8.8 L points where the mock's is 3.6. That is why the project
reads as near-black where the mock reads as charcoal.

The owner asked to fix this **in `roles.css`**, and to **keep the darkest
values** (`paper-950` `#090704`, the darkest ramp step). So: do not touch the
generator or `palette.css`. Point four dark roles at plain hex values, which
`roles.css` explicitly allows ("or at a plain #hex if you want a one-off"),
and leave `paper-950` in the ramp, still used by `scrim` and `veil`.
`scripts/contrast.mjs` (function near line 142) already resolves a plain
`#hex` role value (it accepts `var(--x)`, another role, or `#rrggbb`).

## Current state

`src/styles/roles.css`, the dark block (the first `:root` rule, roughly
lines 74-88; read the live file):

```css
:root {
  --background: var(--paper-950);
  --surface: var(--paper-900);
  --surface-raised: var(--paper-800);
  --surface-sunken: var(--paper-950);
  --foreground: var(--ink-50);
  --muted: var(--ink-300);
  --subtle: var(--ink-400);
  --scrim: var(--paper-950);
  --veil: var(--paper-950);
  --outline: var(--ink-400);
  --border: var(--paper-700);
  --line: var(--paper-800);
  --hover: var(--paper-800);
```

## Commands you will need

| Purpose         | Command                                                    | Expected                                              |
| --------------- | ---------------------------------------------------------- | ----------------------------------------------------- |
| Contrast report | `pnpm check:contrast`                                      | exit 0; every pairing that passed before still passes |
| Manifest        | `pnpm figma-manifest`                                      | writes `figma/manifest.json`                          |
| Static checks   | `pnpm exec tsc --noEmit && pnpm lint && pnpm format:check` | exit 0                                                |
| Full suite      | `pnpm test`                                                | all pass                                              |

## Scope

**In scope:** `src/styles/roles.css` (dark block only), `figma/manifest.json`
(regenerated, never hand-edited).

**Out of scope, do not touch:**

- `scripts/color-ramps.mjs`, `src/styles/palette.css`,
  `src/styles/palette.generated.json`. The ramp is deliberately unchanged.
- The `:root[data-theme="light"]` block. Light mode is not part of this plan.
- `--foreground`, `--muted`, `--subtle`, `--outline`, `--border`, `--line`,
  `--hover`, `--scrim`, `--veil` and every accent/status role.
- Any component CSS. Components use roles; they must not change here.

## Steps

### Step 0 — Capture the baseline

On the unchanged tree run `pnpm check:contrast` and save the output to a
scratch file outside the repo (e.g. `/tmp/contrast-before.txt`).

### Step 1 — Repoint four dark roles at the mock's values

In the dark `:root` block of `src/styles/roles.css`, change exactly these four
lines:

```css
--background: #141311;
--surface: #1d1b18;
--surface-raised: #221f1b;
--surface-sunken: #0c0b09;
```

Add this comment directly above `--background` in that block (match the
file's existing comment style):

```css
/* Dark surfaces are one-off hex (the mock's charcoals), not ramp steps: the
     paper ramp jumps from 950 (#090704, L13) to 900 (#1c1a15, L22), and the
     page background belongs between them (L18.7). paper-950 stays in the ramp
     and is still used by scrim and veil. */
```

**Verify:** `pnpm check:contrast`, then diff against the Step 0 output. Every
pairing that passed before must still pass. If one now fails (most likely
`subtle` or `accent-mark` on `surface-sunken`, because sunken got lighter,
L13 to L15), STOP and report the exact pairing and ratio. Do not edit other
roles to compensate.

### Step 2 — Regenerate the Figma manifest

```bash
pnpm figma-manifest
```

Updates `figma/manifest.json` and its hash. Never hand-edit it. The Figma
file is stale afterward; that is expected (the owner re-syncs it). Do not use
Figma tools.

### Step 3 — Full verification

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm format:check
pnpm test
```

All exit 0. `pnpm test` runs axe in dark and light on every route, so it is
the real regression check for these four roles. Also open `/styleguide` in
`pnpm dev` and confirm the roles table shows the new values and no contrast
row turned red.

## Test plan

No new tests. The axe sweep plus `check:contrast` are the guards.

## Done criteria

- [ ] Only the four listed lines (plus the one comment) changed in `src/styles/roles.css`'s dark block
- [ ] `pnpm check:contrast` exits 0 with no new failures vs. the Step 0 report
- [ ] `figma/manifest.json` regenerated (hash changed)
- [ ] `pnpm test` exits 0, same pass count as before
- [ ] No other files modified
- [ ] `plans/README.md` row 027 updated

## STOP conditions

- Any contrast pairing newly fails (Step 1). Report; do not tune other roles.
- `pnpm test` fails an axe color-contrast check in dark mode.
- A component or test hard-codes `#090704`, `paper-950` or relies on the old
  page/surface relationship. Check with
  `grep -rn "090704\|paper-950" src scripts tests` and report anything outside
  `roles.css` and generated files.

## Maintenance notes

- The owner may later want these as real ramp steps (e.g. add 925/975 to the
  paper ramp in `scripts/color-ramps.mjs`). That is a generator change and was
  deliberately not done here; if it happens, repoint these four roles back to
  `var(--paper-NNN)`.
- The mock's text color is warm cream (`#efe9dc`, L93.5, chroma 0.0185) while
  `--foreground` is neutral `ink-50`. Not changed here (ink was made neutral on
  purpose in plan 003); worth a look when the owner reviews the result.
- Plans 028-031 compare against the mock visually, so land this first. None
  depends on it technically.
