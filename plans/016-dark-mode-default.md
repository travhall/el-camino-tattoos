# Plan 016: Make dark the default theme ("Paper mode" becomes the opt-in)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat a10c785..HEAD -- src/styles/roles.css src/app/layout.tsx src/components/theme-toggle.tsx tests/interactions.spec.ts scripts/lib/parse-css-vars.mjs scripts/contrast.mjs`
> Compare the "Current state" excerpts against the live code before
> proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none (independent of plan 015's shape-language change and plan 017's hero work — safe to run in any order relative to them, but see the STOP conditions for a real conflict to watch for with any other in-flight `roles.css` work)
- **Category**: direction (design-system change, owner-approved)
- **Planned at**: commit `247a87d`, 2026-09-30; rebaselined to `a10c785` and Scope expanded to include `scripts/lib/parse-css-vars.mjs`/`scripts/contrast.mjs` after a first execution attempt found the parser's hard dependency on the old theme structure (see Step 4a) — 2026-09-30

## Why this matters

The owner approved porting a reviewed design mock's identity move: the site
is dark by default, with an explicit toggle to opt into a light "Paper mode"
— not a toggle that merely offers light/dark/system with all three
equal-weight. Today the site does the opposite: it has no opinion of its own
and simply mirrors the visitor's OS `prefers-color-scheme`, with a
three-state manual override (`system` / `light` / `dark`) layered on top.

Making dark genuinely the default means the site must stop consulting
`prefers-color-scheme` for its initial paint. A visitor whose OS is set to
light must still land on the dark site — that's the whole point of "dark is
the default," not "dark is more prominent." This is a real, visible behavior
change for anyone with a light-mode OS, which today's test suite explicitly
asserts the _opposite_ of (see "Current state" below) — read that existing
test before starting; you are correcting its premise, not preserving it.

## Current state

**`src/styles/roles.css`** (full file, 204 lines) currently structures
theming as: a base `:root` block holding the **light** values (lines
70–132), an `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }`
block holding the dark **overrides** — only the properties that differ from
light (lines 138–170), and a `:root[data-theme="dark"]` block (lines
172–204) that the code comments say must stay **byte-identical** to the
`@media` block's declarations, because forcing dark via the toggle must look
exactly like following OS dark preference. `tests/interactions.spec.ts` line
459–478 enforces that byte-identity mechanically:

```ts
test("dark-mode role block in roles.css matches its data-theme twin", async () => {
  const { readFile } = await import("node:fs/promises");
  const css = await readFile("src/styles/roles.css", "utf8");
  const media = css.match(
    /@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme="light"\]\) \{([^}]*)\}/,
  );
  const attr = css.match(/:root\[data-theme="dark"\] \{([^}]*)\}/);
  const declarations = (block: string | undefined) =>
    block
      ?.split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n");
  expect(declarations(media?.[1])).toBeTruthy();
  expect(declarations(attr?.[1])).toBe(declarations(media?.[1]));
});
```

There is no `:root[data-theme="light"]` block today — "light" is simply
whatever the base `:root` already is, so explicitly choosing "light" via the
toggle only needs to _cancel_ the `@media` block, which is why that block's
selector is `:root:not([data-theme="light"])`.

**`src/app/layout.tsx`**, the blocking pre-paint script (full relevant
excerpt, lines 3–12):

```js
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}
})();
`;
```

If nothing is stored, it does nothing, and the `@media` query decides —
i.e. the OS preference wins by default today.

**`src/components/theme-toggle.tsx`** (full file, 87 lines) implements a
three-state cycle `system -> light -> dark -> system`:

```tsx
"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

const next: Record<Theme, Theme> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const labels: Record<Theme, string> = {
  system: "Use system theme",
  light: "Use light theme",
  dark: "Use dark theme",
};

const icons: Record<Theme, string> = {
  system: "⚙",
  light: "☀",
  dark: "☾",
};

const THEME_CHANGE_EVENT = "elcamino:theme-change";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(attr === "light" || attr === "dark" ? attr : "system");

    function onThemeChange(event: Event) {
      setTheme((event as CustomEvent<Theme>).detail);
    }
    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
  }, []);

  function cycle() {
    const value = next[theme];
    setTheme(value);
    if (value === "system") {
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem("theme");
    } else {
      document.documentElement.setAttribute("data-theme", value);
      localStorage.setItem("theme", value);
    }
    window.dispatchEvent(
      new CustomEvent<Theme>(THEME_CHANGE_EVENT, { detail: value }),
    );
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={labels[theme]}
      onClick={cycle}
    >
      <span aria-hidden="true" className="theme-toggle__icon">
        {icons[theme]}
      </span>
    </button>
  );
}
```

`grep -rn '"system"' src/ tests/` confirms `"system"` (the theme state) is
used **only** inside this one file — nothing else in the codebase branches
on it, so removing it cannot break another file.

**`tests/interactions.spec.ts`**, lines 480–505, asserts the _current_
(opposite) behavior — that OS light preference wins until the toggle is
clicked twice:

```ts
test("theme toggle overrides OS preference and persists", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await open(page, "/");

  const background = () =>
    page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue(
        "--background",
      ),
    );
  const lightBackground = await background();

  const toggle = page.getByRole("button", { name: /theme/i });
  await toggle.click(); // system -> light (no visible change, still light)
  await toggle.click(); // light -> dark
  await expect.poll(background).not.toBe(lightBackground);

  await page.reload();
  await page.locator(hydrated).waitFor({ state: "attached" });
  expect(await background()).not.toBe(lightBackground); // persisted

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
});
```

## Commands you will need

| Purpose   | Command                                               | Expected on success |
| --------- | ----------------------------------------------------- | ------------------- |
| Typecheck | `pnpm exec tsc --noEmit`                              | exit 0, no output   |
| Lint      | `pnpm lint`                                           | exit 0              |
| Format    | `pnpm format:check` (fix with `pnpm format`)          | exit 0              |
| Tests     | `pnpm test` (seeds fixtures, builds, runs Playwright) | all pass            |
| One test  | `pnpm test --grep "theme"`                            | matching tests pass |

Use `pnpm` only.

## Scope

**In scope** (the only files you should modify):

- `src/styles/roles.css`
- `src/app/layout.tsx` (the `THEME_INIT_SCRIPT` string only)
- `src/components/theme-toggle.tsx`
- `tests/interactions.spec.ts` (the two tests quoted above only)
- `scripts/lib/parse-css-vars.mjs` (added after a first execution attempt
  found this dependency the plan missed — see Step 4a below; both `.light`
  and `.dark` are consumed by `scripts/contrast.mjs` and
  `scripts/figma-manifest.mjs`, so this file must be fixed for `pnpm build`
  — and therefore `pnpm test` — to pass at all after Step 1)
- `scripts/contrast.mjs` (one stale comment only — see Step 4a)

**Out of scope** (do NOT touch):

- `src/styles/palette.css`, `type-scale.css`, `*.generated.json` — no ramp values change, only which set is the default vs. the override.
- `figma/manifest.json` / `scripts/figma-manifest.mjs` — this plan changes no tracked layout/radius/font value; regenerating the manifest is not needed (the manifest doesn't track "which theme is default").
- Any component in `src/components/` other than `theme-toggle.tsx` — no component references `prefers-color-scheme` or the `Theme` type directly.
- Plans 015 and 017 — independent work.

## Git workflow

- Branch: `advisor/016-dark-default`
- Commit per logical unit, e.g. `feat(theme): make dark the default, light an explicit opt-in` for the roles.css + layout.tsx + theme-toggle.tsx change, then `test(theme): update theme tests for dark-as-default` for the test file.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Rewrite `src/styles/roles.css` — dark becomes the unconditional default

Replace the three theme blocks (base `:root`, the `@media` block, and the
`:root[data-theme="dark"]` block — everything from the current line 70
through the end of the file, line 204) with exactly this:

```css
:root {
  /* Dark — the default theme. No data-theme attribute and no
     prefers-color-scheme check: every visitor lands here unless they've
     explicitly chosen "Paper mode" via the toggle (src/components/theme-toggle.tsx),
     which is recorded below as :root[data-theme="light"]. */
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
  --accent: var(--gold-300);
  --accent-foreground: var(--ink-950);
  --accent-hover: var(--gold-200);
  --accent-text: var(--gold-200);
  --accent-soft: var(--gold-800);
  --accent-mark: var(--gold-300);
  --error: var(--red-500);
  --error-text: var(--red-400);
  --error-soft: var(--red-900);
  --success: var(--green-400);
  --success-text: var(--green-300);
  --success-soft: var(--green-900);
  --warning: var(--gold-400);
  --warning-text: var(--gold-200);
  --warning-soft: var(--gold-900);
  --focus: var(--navy-400);

  /* UI tokens */
  /* Ink: the foreground as a fill, so it never collides with a status color. */
  --button-primary-bg: var(--foreground);
  --button-primary-fg: var(--background);
  --button-primary-hover: var(--ink-200);
  --button-primary-border: var(--foreground);
  --button-secondary-border: var(--outline);
  --button-secondary-fg: var(--foreground);
  --button-secondary-hover: var(--hover);
  --link-text: var(--foreground);
  --link-underline: var(--accent-mark);
  --nav-current: var(--accent-mark);
  --chip-border: var(--outline);
  --chip-hover: var(--hover);
  --chip-selected-bg: var(--foreground);
  --chip-selected-fg: var(--background);
  --selection-bg: var(--accent);
  --selection-fg: var(--accent-foreground);
  --focus-ring: var(--focus);
  --status-open: var(--success);
  --status-waitlist: var(--warning);
  --status-closed: var(--muted);
}

/* Light ("Paper mode"): opt-in only, via the toggle. A partial override —
   only what differs from the dark default above; accent, accent-foreground,
   veil and most UI tokens are the same in both themes and fall through from
   :root unchanged. Set by src/components/theme-toggle.tsx; the blocking
   script in src/app/layout.tsx applies it before paint so there is no flash. */
:root[data-theme="light"] {
  --background: var(--paper-50);
  --surface: var(--paper-100);
  --surface-raised: var(--paper-50);
  --surface-sunken: var(--paper-200);
  --foreground: var(--ink-950);
  --muted: var(--ink-700);
  /* Light mode: subtle stays equal to muted. ink-600 (the next step lighter)
     measures 3.80:1 on surface-sunken, under the 4.5:1 subtle needs there, and
     there is no intermediate ramp step. Dark differentiates subtle from muted
     instead (ink-400 vs ink-300) because the same wall doesn't exist there.
     Fixing light mode would mean lightening surface-sunken itself, which
     affects every section band and the footer — a design call, not a token
     tweak. See plans/012-subtle-text-tier-dark-differentiation.md. */
  --subtle: var(--ink-700);
  --scrim: var(--paper-50);
  --outline: var(--ink-600);
  --border: var(--paper-400);
  --line: var(--paper-300);
  --hover: var(--paper-200);
  --accent-hover: var(--gold-400);
  --accent-text: var(--gold-700);
  --accent-soft: var(--gold-100);
  --accent-mark: var(--gold-600);
  --error: var(--red-600);
  --error-text: var(--red-700);
  --error-soft: var(--red-100);
  --success: var(--green-600);
  --success-text: var(--green-700);
  --success-soft: var(--green-100);
  --warning: var(--gold-700);
  --warning-text: var(--gold-700);
  --warning-soft: var(--gold-100);
  --focus: var(--navy-700);

  /* UI tokens. The ink button is dark text here, so hover lightens toward background. */
  --button-primary-hover: var(--ink-800);
}
```

Leave the file's header comment (lines 1–69, the role/UI-token glossary)
untouched, **except** update this one sentence in the opening paragraph —
change:

> The model: each primitive has one job in BOTH modes, and dark mode just
> uses the other end of the ramp.

to:

> The model: each primitive has one job in BOTH modes, and light mode just
> uses the other end of the ramp. Dark is the default theme (see below).

**Verify**: `grep -c "^:root" src/styles/roles.css` → `2`. `grep -n "prefers-color-scheme\|data-theme=\"dark\"" src/styles/roles.css` → no matches (both are gone). `grep -n "data-theme=\"light\"" src/styles/roles.css` → one match.

### Step 2: Simplify the blocking script in `src/app/layout.tsx`

Replace `THEME_INIT_SCRIPT` with:

```js
const THEME_INIT_SCRIPT = `
(function () {
  try {
    if (localStorage.getItem("theme") === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    }
  } catch (e) {}
})();
`;
```

Nothing else in this file changes.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 3: Rewrite `src/components/theme-toggle.tsx` to a two-state toggle

Replace the full file with:

```tsx
"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

const next: Record<Theme, Theme> = {
  dark: "light",
  light: "dark",
};

const labels: Record<Theme, string> = {
  light: "Use light theme",
  dark: "Use dark theme",
};

const icons: Record<Theme, string> = {
  light: "☀",
  dark: "☾",
};

// Lets more than one <ThemeToggle> be mounted at once (the site header's,
// plus a page-local one) without the instances disagreeing about the
// current theme: each one broadcasts on change and listens for the others.
const THEME_CHANGE_EVENT = "elcamino:theme-change";

/**
 * Toggles dark (the default) <-> light ("Paper mode"). Persists to
 * localStorage; the inline script in src/app/layout.tsx applies a stored
 * "light" choice before paint, so there is no flash. Reads the current value
 * from the DOM (set by that script) rather than localStorage directly, so it
 * starts in sync with whatever the blocking script already applied.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // One-time sync from the DOM: the inline blocking script in
    // src/app/layout.tsx already set data-theme (if any) before React
    // mounted. The server render always assumes "dark" (no document), so
    // this corrects local state to match reality post-hydration. Reading
    // document.documentElement in a lazy useState initializer instead would
    // cause a real hydration mismatch (server has no document); this effect
    // avoids that at the cost of one extra render, which is what this lint
    // rule normally guards against.
    const attr = document.documentElement.getAttribute("data-theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(attr === "light" ? "light" : "dark");

    function onThemeChange(event: Event) {
      setTheme((event as CustomEvent<Theme>).detail);
    }
    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
  }, []);

  function cycle() {
    const value = next[theme];
    setTheme(value);
    if (value === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem("theme");
    }
    window.dispatchEvent(
      new CustomEvent<Theme>(THEME_CHANGE_EVENT, { detail: value }),
    );
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={labels[theme]}
      onClick={cycle}
    >
      <span aria-hidden="true" className="theme-toggle__icon">
        {icons[theme]}
      </span>
    </button>
  );
}
```

This keeps the component's public shape (`<ThemeToggle />`, no props),
class name, and 44px `.theme-toggle` hit area from `components.css`
untouched — only the internal state machine shrinks from three states to
two.

**Verify**: `pnpm exec tsc --noEmit && pnpm lint` → both exit 0. `grep -n '"system"' src/components/theme-toggle.tsx` → no matches.

### Step 4: Update the two theme tests in `tests/interactions.spec.ts`

**4a. Delete** the `"dark-mode role block in roles.css matches its data-theme twin"` test (lines 459–478 quoted in full in "Current state") — the mechanism it guards (two blocks that must stay byte-identical) no longer exists; there is now exactly one dark declaration (the bare `:root`) and nothing to compare it against.

**4b. Replace** the `"theme toggle overrides OS preference and persists"` test (lines 480–505, quoted in full in "Current state") with:

```ts
test("theme defaults to dark regardless of OS preference, and the toggle persists light", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await open(page, "/");

  const background = () =>
    page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue(
        "--background",
      ),
    );
  const darkBackground = await background();

  const toggle = page.getByRole("button", { name: /theme/i });
  await toggle.click(); // dark -> light
  const lightBackground = await background();
  expect(lightBackground).not.toBe(darkBackground);

  await page.reload();
  await page.locator(hydrated).waitFor({ state: "attached" });
  expect(await background()).toBe(lightBackground); // persisted

  await toggle.click(); // light -> dark
  expect(await background()).toBe(darkBackground);

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
});
```

`AxeBuilder` and `expect`/`test`/`hydrated`/`open` are already imported at
the top of this file (used by the test you're replacing) — no new imports
needed.

**Verify**: `pnpm test --grep "theme defaults to dark"` → passes. `grep -n "data-theme twin\|overrides OS preference and persists" tests/interactions.spec.ts` → no matches (both old test names are gone).

### Step 4a: Fix the shared CSS-var parser (discovered mid-execution — read this even if you think Step 1–4 already "worked")

`scripts/lib/parse-css-vars.mjs` exports `parseCssVarRoles`, which both
`scripts/contrast.mjs` and `scripts/figma-manifest.mjs` import and call. It
hard-codes the _old_ theme structure: it classifies a rule as "dark" only if
its selector is exactly `:root:not([data-theme="light"])` inside an
`@media (prefers-color-scheme: dark)` block, or exactly
`:root[data-theme="dark"]` — and treats every other `:root`-prefixed rule as
"light". After Step 1, neither of those two selectors exists anymore (the
base `:root` is now dark, `:root[data-theme="light"]` is the override), so
every declaration gets misclassified as "light," `dark` ends up identical to
`light`, and `contrast.mjs`'s own regression guard throws:

```
Error: checkContrast: light and dark resolved to identical role values — the dark-mode override selectors in roles.css did not parse. This would hide every real dark-mode contrast regression.
```

This throws from inside `src/app/(site)/styleguide/page.tsx` (which calls
`checkContrast` at render time), which fails `pnpm build`, which fails
`pnpm test`. **You cannot complete Step 5 until this is fixed.**

Full current contents of `scripts/lib/parse-css-vars.mjs` (30 lines):

```js
// Shared CSS custom-property parser for scripts/contrast.mjs and
// scripts/figma-manifest.mjs. Both need the same thing: read a stylesheet
// that declares custom properties in a base `:root { ... }` rule plus dark
// overrides — either `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }`
// (OS preference) or `:root[data-theme="dark"] { ... }` (the manual toggle,
// src/components/theme-toggle.tsx) — and return
// { light: Record<name, rawValue>, dark: Record<name, rawValue> } (dark =
// light merged with whichever dark override applies). Uses postcss's real
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

  // `walkRules(":root", cb)` only matches the exact selector string ":root",
  // so it silently skips ":root:not([data-theme=\"light\"])" and
  // ":root[data-theme=\"dark\"]" — both dark-override selectors actually used
  // in roles.css. Walk every rule and classify by selector instead. A
  // substring test for `[data-theme="light"]` would misfire on the `:not()`
  // form (it contains that exact substring while meaning the opposite), so
  // match the two known dark-override selectors exactly instead; anything
  // else :root-prefixed (the base rule, or a hypothetical explicit light
  // override) is light.
  root.walkRules((rule) => {
    if (!rule.selector.startsWith(":root")) return;

    const inDarkMedia =
      rule.parent?.type === "atrule" &&
      rule.parent.name === "media" &&
      /prefers-color-scheme:\s*dark/.test(rule.parent.params);
    const isOsDark =
      inDarkMedia && rule.selector === ':root:not([data-theme="light"])';
    const isForcedDark = rule.selector === ':root[data-theme="dark"]';

    Object.assign(
      isOsDark || isForcedDark ? darkOverrides : light,
      declarationsOf(rule),
    );
  });

  return { light, dark: { ...light, ...darkOverrides } };
}
```

Replace its full contents with:

```js
// Shared CSS custom-property parser for scripts/contrast.mjs and
// scripts/figma-manifest.mjs. Both need the same thing: read a stylesheet
// that declares custom properties in a base `:root { ... }` rule (the
// default theme) plus a `:root[data-theme="light"] { ... }` override (the
// manual toggle, src/components/theme-toggle.tsx) — and return
// { light: Record<name, rawValue>, dark: Record<name, rawValue> }, where
// dark is the base :root values and light is the base merged with whichever
// light override applies. Uses postcss's real parser instead of hand-rolled
// regex, so nested rules, comments containing `;`, and additional at-rules
// elsewhere in the file cannot silently corrupt the result the way a
// regex/brace-counting approach can.
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
  const dark = {};
  const lightOverrides = {};

  root.walkRules((rule) => {
    if (rule.selector === ":root") {
      Object.assign(dark, declarationsOf(rule));
    } else if (rule.selector === ':root[data-theme="light"]') {
      Object.assign(lightOverrides, declarationsOf(rule));
    }
  });

  return { dark, light: { ...dark, ...lightOverrides } };
}
```

The exported shape (`{ light, dark }`) is unchanged, so neither
`contrast.mjs` nor `figma-manifest.mjs` needs any code change beyond the one
comment below — only the internal selector matching changes.

Also update the stale comment in `scripts/contrast.mjs` (currently lines
135–138):

```js
/**
 * Splits roles.css into light values and dark values. Dark is whatever the
 * `prefers-color-scheme: dark` block sets, on top of the light values.
 */
```

to:

```js
/**
 * Splits roles.css into light values and dark values. Light is whatever the
 * `:root[data-theme="light"]` block overrides, on top of the dark (default)
 * values in the base `:root`.
 */
```

Do not change anything else in `contrast.mjs` — `PAIRS`, `checkContrast`,
`resolve`, and the regression guard all work unchanged once the parser
returns correct values.

**Verify**: `pnpm build` → exit 0 (this is the command that was failing;
confirm it now succeeds, including the `/styleguide` prerender). Then
`node -e 'import("./scripts/lib/parse-css-vars.mjs").then(m => { const r = m.parseCssVarRoles(require("fs").readFileSync("src/styles/roles.css","utf8")); console.log(JSON.stringify({ bgLight: r.light.background, bgDark: r.dark.background }, null, 2)); })'`
(or equivalent) shows `bgDark` resolving to `var(--paper-950)` and
`bgLight` resolving to `var(--paper-50)` — i.e. light and dark are no
longer identical.

### Step 5: Full verification

Run, in order: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm format:check`
(fix with `pnpm format` if needed), `pnpm test`.

`pnpm test` re-runs the full axe sweep on every route — this is the most
important check in this plan: dark is now the _first_ paint every route's
axe check sees (the sweep's "light" pass now has to explicitly force light,
which it already does per-route via `colorScheme`, so this should already
work correctly; a failure here most likely means a contrast pairing that
was fine as an override isn't fine as the unconditional default, which
would be a real, new finding to report, not something to silently patch).

**Verify**: all four commands exit 0.

## Test plan

Covered in Step 4: one test asserts dark renders regardless of OS
`prefers-color-scheme: light`, that toggling to light changes the
background and persists across reload, and that toggling back to dark
restores the exact original (default) background value, with a full axe
pass at the end. The existing axe sweep (`pnpm test`, every route, both
color schemes, two widths) is the regression guard for every other page —
no route-specific test changes are needed because the sweep already forces
each color scheme explicitly per pass rather than relying on the OS
default.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0 and `pnpm format:check` exits 0
- [ ] `pnpm test` exits 0, including the new `"theme defaults to dark..."` test
- [ ] `grep -n "prefers-color-scheme" src/styles/roles.css` returns no matches
- [ ] `grep -n '"system"' src/components/theme-toggle.tsx tests/interactions.spec.ts` returns no matches
- [ ] `pnpm build` exits 0 (in particular, `/styleguide` prerenders without `checkContrast` throwing)
- [ ] Visiting `/` in `pnpm dev` with no `localStorage` entry and the OS set to light mode still shows the dark theme
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any excerpt in "Current state" doesn't match the live code — in particular, if another in-flight change has already touched `roles.css`'s theme blocks (e.g. a concurrent color-tuning plan), reconcile by re-reading the live file and re-deriving the dark/light split from its _current_ values rather than the ones quoted here, and note in your summary what you re-derived.
- The full axe sweep (`pnpm test`) fails on a route/theme combination that passed before this change — this means a contrast pairing relied on being an override rather than the default; report the specific route, theme and rule rather than adjusting a color value yourself.
- You find a **third** file (beyond the six now in Scope — the original four plus `scripts/lib/parse-css-vars.mjs` and `scripts/contrast.mjs`, added in Step 4a) that references `prefers-color-scheme` or the theme `"system"` state. (A first execution attempt already found and this plan now accounts for `parse-css-vars.mjs`/`contrast.mjs` — that is not itself a reason to stop; a file beyond those six still is.)

## Maintenance notes

- Any future role or UI token added to `roles.css` must be added to **both**
  blocks if its light and dark values differ, or to **only** the base
  `:root` (dark) block if they're the same in both themes — there is no
  longer a "list everything, then list only the diff" asymmetry to get
  backwards; the dark block is now the complete set, the light block is the
  diff.
- If the owner ever wants a third "follow system" option back, that's a
  design decision (does it coexist with "dark is the brand," or replace it
  again?), not a quick revert of this plan — ask before rebuilding it.
- The axe sweep's light-mode passes now exercise `:root[data-theme="light"]`
  on every route for the first time in this specific configuration — if any
  route's copy or imagery was never actually checked against the light
  palette (unlikely, since the toggle already existed before this plan, but
  worth a reviewer's second look at the diff).
