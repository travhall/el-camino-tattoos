# Plan 010: Replace the two hand-rolled regex CSS parsers with one shared, real parser

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat bea6c5a..HEAD -- scripts/contrast.mjs scripts/figma-manifest.mjs`
> If either file changed since this plan was written, compare the "Current
> state" excerpts below against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `bea6c5a`, 2026-09-29

## Why this matters

Two build/tooling scripts each parse `src/styles/roles.css` (a hand-edited
file that a person, not a generator, freely edits) with their own independent
regex: `scripts/contrast.mjs` (`parseRoles`, lines 135–153) and
`scripts/figma-manifest.mjs` (`parseRoles`, lines 29–45). They are near-copies
today, but nothing keeps them in sync — one already differs subtly in its
variable-name character class (`[a-z0-9-]+` vs `[a-z-]+`, so `figma-manifest.mjs`
would silently fail to pick up a role name containing a digit, e.g. a future
`--gold-300-alias`). Both parsers also rely on hand-rolled logic to isolate
the `@media (prefers-color-scheme: dark) { :root { ... } }` block, which only
works because `roles.css` today has exactly one top-level rule and one media
block. The first time `roles.css` gains a second media query, a nested
selector, or a comment containing a `;` inside a value, both parsers break
silently (wrong values, not a crash) rather than erroring — that's the
dangerous failure mode for a script whose whole job is a WCAG contrast
guarantee. Replacing the regex with a real CSS parser (`postcss`, already a
transitive dependency of this project's own `@tailwindcss/postcss`) removes
this class of bug for good, in a small, mechanical, low-risk change.

## Current state

- `scripts/contrast.mjs` — exports `PAIRS`, `contrast`, `parseRoles`,
  `checkContrast`, `loadInputs`, `passes`. **These exact export names and
  signatures are a public API**: `src/app/(site)/styleguide/page.tsx` imports
  `checkContrast`, `loadInputs`, `passes` directly from this file at
  `../../../../scripts/contrast.mjs` (see that file's imports, lines 5–9).
  `scripts/check-contrast.mjs` imports `checkContrast`, `loadInputs`, `passes`
  too. **Do not rename or change the signature of any exported function.**
  The only thing that may change internally is `parseRoles`'s implementation
  (it is not imported anywhere outside this file, so its internals are free
  to change, but keep its exported shape `{ light: Record<string,string>,
  dark: Record<string,string> }` identical — `checkContrast` depends on it).

  Current `parseRoles` (lines 135–153):

  ```js
  const declarations = (text) =>
    Object.fromEntries(
      [...text.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [
        m[1],
        m[2].trim(),
      ]),
    );

  export function parseRoles(css) {
    const media = /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{/.exec(css);
    let light = css;
    let dark = "";
    if (media) {
      const start = media.index + media[0].length;
      let depth = 1;
      let end = start;
      while (end < css.length && depth > 0) {
        if (css[end] === "{") depth++;
        if (css[end] === "}") depth--;
        end++;
      }
      dark = css.slice(start, end - 1);
      light = css.slice(0, media.index) + css.slice(end);
    }
    const lightVars = declarations(light);
    return { light: lightVars, dark: { ...lightVars, ...declarations(dark) } };
  }
  ```

- `scripts/figma-manifest.mjs` — has its own local `parseRoles` (lines 29–45,
  not exported, used once at line 67), a near-duplicate with a slightly
  different variable-name regex (`[a-z-]+`, no digits) and no brace-depth
  walk (it uses a single non-greedy regex `/prefers-color-scheme:\s*dark\)\s*{\s*:root\s*{([^}]*)}/`
  instead, which is even more fragile — it assumes the dark block's `:root`
  is the *only* nested `{...}` and would truncate at the first inner `}` if
  one ever appeared):

  ```js
  function parseRoles(css) {
    const declarations = (block) =>
      Object.fromEntries(
        [...block.matchAll(/--([a-z-]+):\s*([^;]+);/g)].map((m) => [
          m[1],
          m[2].trim(),
        ]),
      );
    const dark = css.match(
      /prefers-color-scheme:\s*dark\)\s*{\s*:root\s*{([^}]*)}/,
    );
    const light = css.replace(dark ? dark[0] : "", "").match(/:root\s*{([^}]*)}/);
    if (!light) throw new Error("roles.css: no :root block found");
    const lightRoles = declarations(light[1]);
    const darkRoles = { ...lightRoles, ...(dark ? declarations(dark[1]) : {}) };
    return { light: lightRoles, dark: darkRoles };
  }
  ```

  `figma-manifest.mjs` is a standalone script (`node scripts/figma-manifest.mjs`,
  invoked by `pnpm figma-manifest`), not imported elsewhere — free to change
  its internals, keeping the shape `{ light, dark }` it produces at line 67
  (`parseRoles(read("src/styles/roles.css"))`) identical, since `resolve()`
  (lines 52–65) and the `roles` object built at lines 68–76 consume
  `parsed.light[name]` / `parsed.dark[name]` by key.

- `postcss` is not currently a direct dependency (`node --input-type=module -e
  "import('postcss')"` fails with `Cannot find package 'postcss'`), only a
  transitive one via `@tailwindcss/postcss`. It must be added as a direct
  `devDependency` since these scripts import it directly.

- No `scripts/lib/` directory exists yet in this repo (`scripts/` currently
  contains only flat `.mjs` files: `check-contrast.mjs`, `check-images.mjs`,
  `color-ramps.mjs`, `contrast.mjs`, `e2e.mjs`, `figma-manifest.mjs`,
  `fixtures.mjs`, `type-scale.mjs`). This plan creates the directory.

- Repo convention: scripts are plain ESM `.mjs` in `scripts/`, no TypeScript,
  no test framework wired to them directly — `pnpm check:contrast` and
  `pnpm figma-manifest` running clean is the verification.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install new dep | `pnpm add -D postcss` | exits 0, `postcss` added to `devDependencies` in `package.json`, `pnpm-lock.yaml` updated |
| Contrast check | `pnpm check:contrast` | `check-contrast: 69 pairings x 2 themes, all pass.` (same count as before this change — if the count changes, something broke parsing) |
| Figma manifest | `pnpm figma-manifest` | prints `figma/manifest.json  hash <10-hex-chars>  (N roles, 10 layout tokens)` |
| Diff the manifest | `git diff figma/manifest.json` | **no diff** — the hash and every value must be byte-identical to before this change, since no role or ramp value changed, only how the file is parsed |
| Format | `pnpm format` | exits 0 |
| Lint | `pnpm lint` | exits 0 |
| Full build | `pnpm build` | exits 0 (this is the repo's type-check gate — there is no separate `tsc`/`typecheck` script) |

## Scope

**In scope**:
- `package.json` / `pnpm-lock.yaml` — add `postcss` as a `devDependency`.
- `scripts/lib/parse-css-vars.mjs` (new file) — the shared parser.
- `scripts/contrast.mjs` — replace `parseRoles`'s internals to use the shared
  parser; keep the exported function name and shape.
- `scripts/figma-manifest.mjs` — replace its local `parseRoles`'s internals
  the same way.

**Out of scope** (do NOT touch):
- `PAIRS`, `contrast`, `checkContrast`, `loadInputs`, `passes` in
  `scripts/contrast.mjs` — no behavior change to any of these in this plan.
  (A different plan, 011, edits `PAIRS`. If you land this plan first, 011
  applies cleanly on top; do not pre-emptively touch `PAIRS` here.)
- `scripts/color-ramps.mjs` — unrelated (it does not parse `roles.css`).
- Any value in `src/styles/roles.css` itself — this plan changes how CSS is
  *read*, never what it says.
- `resolve()` in `scripts/figma-manifest.mjs` (lines 52–65) — it consumes the
  `{ light, dark }` output, not the parsing itself; leave it as is.

## Git workflow

- Branch: `advisor/010-shared-css-var-parser`
- Commit per step (e.g. one commit adding the dependency + shared module,
  one per script migrated). Message style: conventional commits, matching
  recent history — e.g. `fix(palette): update color values for improved
  contrast and consistency`, `test(color): measure edge, marks and errors on
  raised and sunken surfaces`. Use `refactor(scripts): ...` for this work.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: add `postcss` and write the shared parser

Run `pnpm add -D postcss`.

**Verify**: `grep '"postcss"' package.json` → prints a line inside
`devDependencies`.

Create `scripts/lib/parse-css-vars.mjs`:

```js
// Shared CSS custom-property parser for scripts/contrast.mjs and
// scripts/figma-manifest.mjs. Both need the same thing: read a stylesheet
// that declares custom properties in a base `:root { ... }` rule plus a
// `@media (prefers-color-scheme: dark) { :root { ... } }` override, and
// return { light: Record<name, rawValue>, dark: Record<name, rawValue> }
// (dark = light merged with the media-query overrides). Uses postcss's real
// parser instead of hand-rolled regex, so nested rules, comments containing
// `;`, and additional at-rules elsewhere in the file cannot silently corrupt
// the result the way a regex/brace-counting approach can.
import postcss from "postcss";

/** Collects `--name: value;` declarations directly inside a postcss Rule. */
function declarationsOf(rule) {
  const out = {};
  rule.walkDecls(/^--/, (decl) => {
    out[decl.prop.slice(2)] = decl.value.trim();
  });
  return out;
}

/**
 * @param {string} css
 * @returns {{ light: Record<string,string>, dark: Record<string,string> }}
 */
export function parseCssVarRoles(css) {
  const root = postcss.parse(css);
  const light = {};
  const darkOverrides = {};

  root.walkRules(":root", (rule) => {
    const inDarkMedia =
      rule.parent?.type === "atrule" &&
      rule.parent.name === "media" &&
      /prefers-color-scheme:\s*dark/.test(rule.parent.params);
    Object.assign(inDarkMedia ? darkOverrides : light, declarationsOf(rule));
  });

  return { light, dark: { ...light, ...darkOverrides } };
}
```

**Verify**: `node --input-type=module -e "import('./scripts/lib/parse-css-vars.mjs').then(m=>console.log(typeof m.parseCssVarRoles))"`
→ prints `function`.

### Step 2: migrate `scripts/contrast.mjs`

Replace the `declarations` helper and `parseRoles` function (current text
quoted in "Current state" above) with:

```js
import { parseCssVarRoles } from "./lib/parse-css-vars.mjs";

export const parseRoles = parseCssVarRoles;
```

Remove the now-unused local `declarations` function. Keep every other export
(`PAIRS`, `contrast`, `checkContrast`, `loadInputs`, `passes`) untouched.

**Verify**: `pnpm check:contrast` → `check-contrast: 69 pairings x 2 themes, all pass.`
(exact same count as before — confirms the new parser reads `roles.css`
identically to the old one).

### Step 3: migrate `scripts/figma-manifest.mjs`

Replace its local `parseRoles` function (current text quoted in "Current
state" above) with an import, same pattern as Step 2:

```js
import { parseCssVarRoles } from "./lib/parse-css-vars.mjs";
```

and change the call site at (previously) line 67 from `parseRoles(...)` to
`parseCssVarRoles(...)`.

**Verify**:
1. `pnpm figma-manifest` → prints the hash line with no error.
2. `git diff figma/manifest.json` → **empty**. This is the load-bearing
   check: the manifest's `hash` field is a SHA-256 of the whole resolved
   token tree, so any parsing discrepancy between the old and new code shows
   up as a changed hash. If the diff is non-empty, STOP (see below).

### Step 4: tidy and gate

`pnpm format` then `pnpm lint` then `pnpm build`.

**Verify**: all three exit 0.

## Test plan

There is no existing unit-test harness for `scripts/*.mjs` (verification is
via the scripts' own exit codes and the Playwright suite in `pnpm test`,
which does not exercise these scripts directly). This plan does not add one —
matching the repo's existing pattern, correctness is verified by:
- `pnpm check:contrast` reporting the same pairing count and all-pass result
  as before this change (Step 2's verify).
- `git diff figma/manifest.json` being empty after regenerating it (Step 3's
  verify) — the strongest possible check, since it means the new parser
  produced byte-identical output to the old one across every role, in both
  themes.

Do not add a new test framework or new test files for this plan; that would
be a bigger change than the finding warrants.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm check:contrast` exits 0 and reports `69 pairings x 2 themes, all pass.`
- [ ] `pnpm figma-manifest` exits 0 and `git diff figma/manifest.json` is empty
- [ ] `grep -n "let depth = 1" scripts/contrast.mjs` returns no matches (old brace-walk removed)
- [ ] `grep -n "function parseRoles" scripts/figma-manifest.mjs` returns no matches (old local parser removed)
- [ ] `pnpm lint` exits 0
- [ ] `pnpm build` exits 0
- [ ] `git status` shows changes only in: `package.json`, `pnpm-lock.yaml`, `scripts/lib/parse-css-vars.mjs`, `scripts/contrast.mjs`, `scripts/figma-manifest.mjs`
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `git diff figma/manifest.json` is non-empty after Step 3 — it means the new
  parser disagrees with the old one about at least one role's value. Do not
  try to patch the shared parser to match by trial and error; report the
  exact diff and which role(s) differ.
- `pnpm check:contrast`'s pairing count changes from 69, or any pairing that
  previously passed now fails (or vice versa).
- `roles.css` at the cited line ranges has drifted from the excerpts above in
  a way that changes its structure (e.g. a second `@media` block, a nested
  selector inside `:root`) — that's new territory this plan's parser design
  was not built to guarantee; report it rather than guessing.
- `postcss.parse` throws on `roles.css` — it is hand-written CSS and should
  be valid, but if it isn't, that's a separate, pre-existing bug worth
  reporting on its own, not something to silently work around here.

## Maintenance notes

- Any future script that needs to read `roles.css` (or a similarly-shaped
  hand-edited CSS file) should import `parseCssVarRoles` from
  `scripts/lib/parse-css-vars.mjs` rather than writing a third regex parser.
- If `roles.css` ever gains a *second* dark-mode-shaped override (e.g. the
  manual light/dark toggle in `plans/013-manual-theme-toggle.md`, which adds
  `:root[data-theme="dark"]` rules outside the `@media` block),
  `parseCssVarRoles` as written here only merges the
  `@media (prefers-color-scheme: dark)` block into `dark` — it does not know
  about attribute-selector overrides. Revisit this function when that lands;
  don't silently assume it already handles it.
- A reviewer should scrutinize: that `figma/manifest.json`'s diff really is
  empty (not just "small") after Step 3, and that no export name changed in
  `contrast.mjs` (a rename would silently break `styleguide/page.tsx`, which
  the build's static import resolution would catch, but double-check anyway).
