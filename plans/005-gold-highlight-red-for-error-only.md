# Plan 005: Point `highlight` at gold, keep red for errors, retire the dark gold-900 tint

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 8d2892d..HEAD -- src/styles/roles.css scripts/contrast.mjs "src/app/(site)/styleguide/page.tsx" CLAUDE.md README.md figma/manifest.json`
> Plans 003 and 004 change the ramps (not these files); `figma/manifest.json` may
> differ because of them. If any other in-scope file changed, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW (role pointers and wording; `pnpm check:contrast` gates it)
- **Depends on**: plans/003-cool-paper-and-neutral-ink-pins.md and plans/004-gold-ramp-hue-drift.md (this plan's contrast numbers assume their ramps)
- **Category**: direction
- **Planned at**: commit `8d2892d`, 2026-09-25

## Why this matters

The owner's direction is a navy ground with gold action AND gold highlights, and
red kept for error only. Today `highlight` (nav and link underlines, state marks)
is red and shares its exact value with `error`, so "current page" and "invalid
field" look alike. Pointing `highlight` at gold separates them and makes gold the
single brand voice. This plan also moves the dark-mode `accent-soft` tint from
`gold-900`, a muddy near-black brown (chroma 0.044), to `gold-800`, which reads as
a deeper gold. The `error` roles are untouched and keep pointing at red directly.

## Current state

`src/styles/roles.css` today (light block, lines 71-73; dark block, lines 98-102):

```css
--highlight: var(--red-600);
--highlight-foreground: var(--ink-50);
--highlight-text: var(--red-700);
```

```css
--accent-soft: var(--gold-900);
--highlight: var(--red-500);
--highlight-foreground: var(--ink-950);
--highlight-text: var(--red-400);
```

Header comment lines to update: line 10 `red ..... highlight marks, and error feedback`
and line 9 `gold .... accent fills and their labels`; lines 38-40:

```
 *   highlight ............ red marks: underlines, state indicators (3:1)
 *   highlight-foreground . text on a highlight fill
 *   highlight-text ....... red as readable text
```

Where `highlight` is used: `src/styles/components.css:34` (nav current-page
underline: `decoration-highlight`) and `src/styles/typography.css:60,87` (`.link` and
another link style, underlined with `decoration-highlight`). No test names it.

Text that says "red" for highlight and must be corrected:

- `src/app/(site)/styleguide/page.tsx` roles list: `{ name: "highlight", note: "red marks: underlines, states" }` and `{ name: "highlight-text", note: "red as readable text" }`.
- `scripts/contrast.mjs` PAIRS notes (lines 45-49): `"red as text"`, `"red as text on surface"`, `"red underlines and state marks"`, `"red state marks on surface"`, `"text on red fill"`. Change only these note strings, never the roles or minimums.
- `CLAUDE.md`, the "Color is primitives mapped to semantic roles" bullet: it says `red` = highlight and error (in the list of primitive jobs) and `highlight` (red) for underlines and state marks (3:1). README.md line 23 only lists `highlight` as a role name; no change needed there.

Conventions: roles point at ramp steps, never a hex or ramp name in components;
"never point a role at a ramp outside its job" — gold's job (per `roles.css`) is
accent fills and their labels, and this plan extends it to highlight marks. Read
the top of `roles.css` before editing.

Verified beforehand (simulated with the plan 003 and 004 ramps): all 45 existing
pairings pass with the values below. Note `highlight` on `surface-sunken` in light
mode would be 2.63:1; nothing uses `surface-sunken` yet and plan 006 owns that.

## Commands you will need

| Purpose          | Command                              | Expected on success                                 |
| ---------------- | ------------------------------------ | --------------------------------------------------- |
| Contrast check   | `pnpm check:contrast`                | `check-contrast: 45 pairings x 2 themes, all pass.` |
| Figma manifest   | `pnpm figma-manifest`                | prints a new `hash`                                 |
| Format / lint    | `pnpm format:check` and `pnpm lint`  | exit 0                                              |
| Full test (slow) | `pnpm test`                          | exit 0                                              |
| Dev server       | `pnpm dev` (then open `/styleguide`) | nav underline and links render gold                 |

## Scope

**In scope** (the only files you should modify):

- `src/styles/roles.css`
- `scripts/contrast.mjs` (note strings only)
- `src/app/(site)/styleguide/page.tsx` (the two `note` strings only)
- `CLAUDE.md` (the color bullet wording only)
- `figma/manifest.json` (generated by `pnpm figma-manifest`)

**Out of scope** (do NOT touch):

- Any `error`, `error-text`, `error-soft` role: they stay on red.
- `scripts/color-ramps.mjs` and the generated palette files.
- `PAIRS` entries (roles and minimums) in `scripts/contrast.mjs`; plan 006 adds
  pairings.
- `components.css` and `typography.css`: they already use the `highlight` role.
- The `surface-sunken` and `surface-raised` values (owner hand-tunes; plan 006).

## Git workflow

- Branch: `advisor/005-gold-highlight`
- One commit, conventional-commit style, e.g.
  `feat(color): make highlight gold and keep red for errors`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Baseline

Run `pnpm check:contrast`.

**Verify**: all pass. If plans 003 and 004 have not landed, STOP: this plan's
values were checked against their ramps.

### Step 2: Edit the role pointers in `roles.css`

Light block:

```css
--highlight: var(--gold-500);
--highlight-foreground: var(--ink-950);
--highlight-text: var(--gold-700);
```

Dark block (change these three; `--highlight-foreground` is already `ink-950` and
stays):

```css
--accent-soft: var(--gold-800);
--highlight: var(--gold-300);
--highlight-foreground: var(--ink-950);
--highlight-text: var(--gold-200);
```

Update the header comment: line 9 gold's job becomes
`gold .... accent fills, their labels, and highlight marks`; line 10 becomes
`red ..... error feedback (highlight moved to gold)`; lines 38 and 40 say `gold`
instead of `red` (`gold marks: underlines, state indicators (3:1)` and
`gold as readable text`).

**Verify**: `grep -n "red" src/styles/roles.css` shows red only on the `--error`,
`--error-text`, `--error-soft` lines and in comments about errors.

### Step 3: Wording in three other places

- `scripts/contrast.mjs`: change the five note strings listed in "Current state"
  to say gold (for example `"gold as text"`, `"gold underlines and state marks"`,
  `"text on gold highlight fill"`). Do not change any role name or minimum.
- `src/app/(site)/styleguide/page.tsx`: `highlight` note becomes
  `"gold marks: underlines, states"`; `highlight-text` becomes
  `"gold as readable text"`.
- `CLAUDE.md`: in the color bullet, change `red` = highlight and error to gold =
  accent fills and highlight marks, red = error; and `highlight` (red) to
  `highlight` (gold). Keep the rest of the bullet exactly as is.

**Verify**: `git diff -U0 scripts/contrast.mjs | grep '^[+-]' | grep -v '"'`
shows only the two diff header lines (no non-string changes).

### Step 4: Contrast and manifest

Run `pnpm check:contrast`, then `pnpm figma-manifest`.

**Verify**: all 45 pairings pass; manifest hash changes. Expected key ratios
(from the simulation): `highlight` on `background` 3.89 light / 10.05 dark;
`highlight` on `surface` 3.48 light; `highlight-foreground` on `highlight` 4.74
light. If any pairing fails, STOP and report; do not pick a different step.

### Step 5: Look at it, then full verification

Run `pnpm dev`, open `/styleguide` and a page with the header, in light and dark
(browser dev tools can emulate `prefers-color-scheme`). Confirm the current-page
nav underline and `.link` underlines are gold, and an invalid form field
(the `/styleguide` Form fields section) is still red.

Then run `pnpm format:check`, `pnpm lint`, `pnpm test`.

**Verify**: all exit 0.

## Test plan

No new tests: role pointers and wording. `pnpm check:contrast` covers the
pairings, and the existing axe pass in `pnpm test` covers every route in light
and dark.

## Done criteria

- [ ] `grep -n "highlight" src/styles/roles.css` shows gold pointers in both blocks
- [ ] `grep -n "red-" src/styles/roles.css` shows only error roles
- [ ] `pnpm check:contrast` all pass; `pnpm format:check`, `pnpm lint`, `pnpm test` exit 0
- [ ] `CLAUDE.md` no longer says `red` = highlight
- [ ] Only the in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Plans 003 or 004 have not landed (the ramps differ).
- The `roles.css` excerpts don't match.
- A contrast pairing fails after Step 2.
- A component or test turns out to depend on highlight being red (for example a
  test asserting a red underline).

## Maintenance notes

- `highlight` and `accent-text` now resolve to the same steps in both modes. Keep
  them as separate roles: they mean different things and may diverge.
- Light-mode `highlight` (gold-500) is 2.63:1 on `surface-sunken`. Nothing uses
  that surface yet; plan 006 decides how to handle it before it is used.
- When red and green are integrated later, red's remaining job is `error*`; new
  red uses (flash ornament) need their own roles, not `highlight`.
- Reviewer focus: the nav underline and link underlines in both modes, and that
  errors still read red.
