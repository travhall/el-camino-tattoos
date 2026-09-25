# Plan 008: Sync the favicon and logo SVG colors to the ink ramp

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 8d2892d..HEAD -- src/app/icon.svg public/logo.svg src/styles/palette.css`
> `palette.css` is expected to differ if plan 003 landed. Compare the "Current
> state" excerpts against the live files; on any other mismatch, treat it as a
> STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/003-cool-paper-and-neutral-ink-pins.md (the ink values to copy)
- **Category**: tech-debt
- **Planned at**: commit `8d2892d`, 2026-09-25

## Why this matters

Two SVG files hard-code colors, because an SVG served as a favicon or an `<img>`
cannot read the page's CSS variables. They use `#252015` (light) and `#f9f5f0`
(dark), warm shades that match no ramp step even today (ink-950 is `#0b0a09`,
ink-50 is `#fef7f0`). After plan 003 makes ink neutral, they would be off-palette
by a visible margin. This plan copies the new `ink-950` and `ink-50` values in so
the favicon and the logo file match the text color of the site.

## Current state

`src/app/icon.svg` (the Next.js file-convention favicon) carries its own
theme switch in an inline style. Its style element today:

```
<style>.mark{fill:#252015}@media (prefers-color-scheme:dark){.mark{fill:#f9f5f0}}</style>
```

The two path elements use `class="mark"`, so only the style element changes.

`public/logo.svg` is the same wordmark artwork for anywhere an `<img>` is needed
(`src/components/site-logo.tsx` says: keep the two in sync). It is a single color
with four occurrences of `fill="#252015"`.

`src/components/site-logo.tsx` uses `currentColor` and needs no change.

Values to copy (from `src/styles/palette.css` after plan 003): `--ink-950: #090a0c;`
for the light-mode mark and the logo file, `--ink-50: #f7f8fa;` for the dark-mode
mark. Read them from `palette.css` rather than trusting this text; if they differ
because the owner retuned ink, use what the file says.

Convention: `.prettierignore` lists `public`, and prettier does not rewrite SVG,
so `pnpm format:check` is not a concern for these files.

## Commands you will need

| Purpose      | Command                                                | Expected on success                                     |
| ------------ | ------------------------------------------------------ | ------------------------------------------------------- |
| Read ink     | `grep -E -- "--ink-(50\|950):" src/styles/palette.css` | two lines                                               |
| Find old hex | `grep -rn "252015\|f9f5f0" src public`                 | prints nothing after the change                         |
| Full test    | `pnpm test`                                            | exit 0 (builds the site, so a broken SVG would surface) |

## Scope

**In scope** (the only files you should modify):

- `src/app/icon.svg`
- `public/logo.svg`

**Out of scope** (do NOT touch):

- `src/components/site-logo.tsx` (already `currentColor`).
- Any path geometry in either SVG: change color values only.
- `scripts/color-ramps.mjs`, `palette.css`, `roles.css`.

## Git workflow

- Branch: `advisor/008-favicon-logo-ink`
- One commit, e.g. `fix(brand): match the favicon and logo colors to the ink ramp`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Read the ink values

Run `grep -E -- "--ink-(50|950):" src/styles/palette.css`.

**Verify**: two lines. With plan 003 landed they are `#f7f8fa` (ink-50) and
`#090a0c` (ink-950). If the values are still `#fef7f0` and `#0b0a09`, plan 003
has not landed: STOP.

### Step 2: Update `src/app/icon.svg`

In the style element replace `#252015` with the ink-950 value and `#f9f5f0` with
the ink-50 value. With the expected values the element becomes:

```
<style>.mark{fill:#090a0c}@media (prefers-color-scheme:dark){.mark{fill:#f7f8fa}}</style>
```

**Verify**: `grep -c "252015\|f9f5f0" src/app/icon.svg` prints `0`, and
`git diff --stat` shows only the style line changed in that file.

### Step 3: Update `public/logo.svg`

Replace all four `fill="#252015"` occurrences with `fill="<ink-950 value>"`.

**Verify**: `grep -c "252015" public/logo.svg` prints `0`;
`grep -o 'fill="#[0-9a-f]*"' public/logo.svg | sort | uniq -c` shows only the ink-950
value (and `fill="none"` is untouched).

### Step 4: Whole-repo check and test

Run `grep -rn "252015\|f9f5f0" src public` and then `pnpm test`.

**Verify**: grep prints nothing; `pnpm test` exits 0.

## Test plan

No new tests. The favicon is rendered by the browser tab, so a quick manual look
in `pnpm dev` (light and dark tab themes) is the only visual check; report if you
could not do it.

## Done criteria

- [ ] `grep -rn "252015\|f9f5f0" src public` prints nothing
- [ ] Both SVGs use the ink-950 value (and the icon's dark rule uses ink-50) as read from `palette.css`
- [ ] `pnpm test` exits 0
- [ ] Only the two in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Plan 003 has not landed (ink values unchanged).
- Either SVG contains more colors than described (for example a gradient or a
  second fill): report instead of guessing.
- You are tempted to edit path data or `site-logo.tsx`.

## Maintenance notes

- These two files are hand-copied from the ink ramp. Whenever ink-950 or ink-50
  is retuned in `scripts/color-ramps.mjs`, re-sync them. There is no automated
  check; a small script asserting the SVG hexes equal the palette would be a
  worthwhile follow-up if the ink pins are retuned often.
- `public/logo.svg` is a single dark color on a transparent background, so it
  only reads on light backgrounds. If a dark-background variant is needed, add
  one rather than changing this file.
