@AGENTS.md

## Styling conventions

- **Semantic classes in markup, utilities in CSS.** JSX uses named classes (`.artist-card`, `.stack`, `.button--secondary`). Tailwind utilities are applied inside those classes with `@apply`. Avoid inline utility classes in JSX; reach for one only when no semantic class fits, and then prefer adding a semantic class.
- **Where styles live** (all imported by `src/app/globals.css`, inside `@layer components`):
  - `src/styles/typography.css`: `.display`, `.heading-1..4` (also the default for `h1..h4`), `.lead`, `.small`, `.caption`, `.eyebrow`, `.muted`, `.link`, `.measure`.
  - `src/styles/layout.css`: `.page`, `.stack` (`--sm|--lg|--xl`), `.cluster`, `.section-header`, `.image-cover`, `.image-contain`.
  - `src/styles/components.css`: one BEM-style block per component (`.block`, `.block__element`, `.block--modifier`).
  - `src/styles/styleguide.css`: `/styleguide` only.
- **Naming:** `block__element` for parts, `block--modifier` for variants. Use `[aria-current]`, `[aria-expanded]` and other state attributes in selectors rather than conditional class names.
- **Type scale is generated.** Edit the config in `scripts/type-scale.mjs`, run `npm run type-scale`, and never hand-edit `src/styles/type-scale.css` or `type-scale.generated.json`. Sizes are fluid `--text-*` tokens (`text-xs` to `text-6xl`) that replace Tailwind's defaults.
- **Color tokens are semantic roles, defined only in `src/styles/theme.css`.** Never write a hex value or a hue name (`green`, `orange`) anywhere else; re-theming means editing that one file. Roles: `background`, `surface`, `foreground`, `accent` (with `accent-foreground`), plus `muted`, `outline`, `line`, `hover`, `subtle` as tints of the foreground. Use them instead of opacity modifiers like `foreground/70`. `accent` is about 2:1 on the canvas, so use it for fills and decoration only, never for text or focus rings. Use `outline` (3:1) for borders on interactive controls and `line` for decorative dividers.
- **Fonts:** Cosmic (`font-display`) is for headings and display type, and Hanken Grotesk (`font-sans`) for everything else.
- **New UI goes in `/styleguide` first**, then into components.
- **Formatting:** `npm run format` (Prettier with the Tailwind plugin). CI runs `format:check`.
