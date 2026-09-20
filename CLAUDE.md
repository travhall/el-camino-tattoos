@AGENTS.md

## Tooling

- **pnpm only.** Use `pnpm install`, `pnpm dev`, `pnpm <script>` and `pnpm dlx`; never npm or npx, and don't create `package-lock.json`. The version is pinned in `package.json` (`packageManager`), and CI and Netlify use it.
- **Restart cache gotcha:** Turbopack caches dev compiles in `.next/dev/cache`, and it can miss changes to CSS files that `globals.css` `@import`s (the generated palette and type scale). If `pnpm dev` shows a stale CSS error for code that no longer exists, run `rm -rf .next` and restart.

## Styling conventions

- **Semantic classes in markup, utilities in CSS.** JSX uses named classes (`.artist-card`, `.stack`, `.button--secondary`). Tailwind utilities are applied inside those classes with `@apply`. Avoid inline utility classes in JSX; reach for one only when no semantic class fits, and then prefer adding a semantic class.
- **Where styles live** (all imported by `src/app/globals.css`, inside `@layer components`):
  - `src/styles/typography.css`: `.display`, `.heading-1..4` (also the default for `h1..h4`), `.lead`, `.small`, `.caption`, `.eyebrow`, `.muted`, `.link`, `.measure`.
  - `src/styles/layout.css`: `.page`, `.stack` (`--sm|--lg|--xl`), `.cluster`, `.section-header`, `.image-cover`, `.image-contain`.
  - `src/styles/components.css`: one BEM-style block per component (`.block`, `.block__element`, `.block--modifier`).
  - `src/styles/styleguide.css`: `/styleguide` only.
- **Naming:** `block__element` for parts, `block--modifier` for variants. Use `[aria-current]`, `[aria-expanded]` and other state attributes in selectors rather than conditional class names.
- **Type scale is generated.** Edit the config in `scripts/type-scale.mjs`, run `pnpm type-scale`, and never hand-edit `src/styles/type-scale.css` or `type-scale.generated.json`. Sizes are fluid `--text-*` tokens (`text-xs` to `text-6xl`) that replace Tailwind's defaults.
- **Color is generated from ramps and used through semantic roles.** Brand colors are pinned in `scripts/color-ramps.mjs`, which builds OKLCH ramps (`ink`, `accent`, `paper`), picks a step per role for light and dark, and FAILS if any pairing misses its WCAG target. Run `pnpm color-ramps` after editing it, and never hand-edit `src/styles/palette.css` or `palette.generated.json`. Never write a hex value or a hue name (`green`, `orange`) anywhere else, and don't reference ramp steps (`ink-700`) from components; use roles. Roles: `background`, `surface`, `foreground`, `muted`, `outline`, `line`, `hover`, `accent`, `accent-foreground`, `accent-text`, `accent-soft`, `focus`. Guidance: `accent` is for fills, `accent-text` when orange must be text or a link color, `outline` (3:1) for borders on interactive controls, `line` for decorative dividers. `src/styles/theme.css` maps roles to Tailwind utilities.
- **Fonts:** Cosmic (`font-display`) is for headings and display type, and Hanken Grotesk (`font-sans`) for everything else.
- **New UI goes in `/styleguide` first**, then into components.
- **Formatting:** `pnpm format` (Prettier with the Tailwind plugin). CI runs `format:check`.
