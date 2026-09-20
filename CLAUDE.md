@AGENTS.md

## Tooling

- **pnpm only.** Use `pnpm install`, `pnpm dev`, `pnpm <script>` and `pnpm dlx`; never npm or npx, and don't create `package-lock.json`. The version is pinned in `package.json` (`packageManager`), and CI and Netlify use it.
- **Restart cache gotcha:** Turbopack caches dev compiles in `.next/dev/cache`, and it can miss changes to CSS files that `globals.css` `@import`s (the generated palette and type scale). If `pnpm dev` shows a stale CSS error for code that no longer exists, run `rm -rf .next` and restart.

## Forms and analytics

- **Contact form uses Netlify Forms.** On Netlify's Next runtime, pages aren't static HTML, so Netlify detects forms from `public/__forms.html` and `ContactForm` posts urlencoded data there (with a no-JS fallback that redirects to `/contact/thanks`). Field names in `__forms.html` MUST match `src/components/contact-form.tsx`. It has a honeypot (`bot-field`). Locally the POST has nowhere to go, so tests mock it. Not yet verified on a real deploy.
- **Analytics** (`src/components/analytics.tsx`) renders only when `CLOUDFLARE_ANALYTICS_TOKEN` is set. It's cookieless. To change provider, replace that one component.

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
- **Spacing is a fluid scale too.** `pnpm type-scale` also writes `--spacing-fluid-3xs` to `--spacing-fluid-3xl`, used as `gap-fluid-md`, `p-fluid-lg`, `py-fluid-xl`. Prefer these over numeric utilities (`gap-4`) for layout spacing. The `fluid-` prefix is load-bearing: a bare `--spacing-md` would hijack Tailwind's `max-w-md`, `w-xl` and other size utilities that share the same names.
- **New UI goes in `/styleguide` first**, then into components.

## Accessibility conventions

- **Landmarks and skip link** live in `SiteShell` (`skip-link`, `<main id="main" tabindex="-1">`). Don't remove or reorder them; the skip link must stay the first tab stop.
- **Touch targets:** standalone interactive elements are at least 44px (`min-h-11`). Inline links inside running text are exempt. Only use `.button--sm` for compact, secondary controls.
- **State is never color alone.** Current page or section uses `aria-current` with an underline (nav) or fill plus weight (filter chips). Style from the attribute, not a class.
- **Motion:** use `--duration-fast|base|slow` and `--ease-out`. A global `prefers-reduced-motion` rule in `globals.css` shortens all transitions and animations, so don't add animation that depends on running for its meaning.
- **Forced colors:** buttons keep a transparent border so they keep an edge when fills are removed. Focus uses `outline` (never box-shadow) with the `--focus` role.
- **Images:** content images get descriptive `alt`. Use `alt=""` when the same link already has the name as text (artist cards).
- **Heading order:** don't skip levels. Components that render headings take a `headingLevel` (see `ArtistCard`).
- **404 and error titles:** render `<title>` inside the component (`NotFoundContent`, `ErrorContent`). The `metadata` title on a not-found page is replaced by the layout default after hydration.
- **Known framework quirk:** Next serves `notFound()` responses with `<html id="__next_error__">` and no `lang` until hydration. Everything is correct after hydration, and the 404 status and content are right.
- **`pnpm test` guards all of this.** It seeds fixture content, builds, and runs Playwright: axe-core (WCAG 2.0 to 2.2 A/AA plus best-practice) on every route in light and dark at phone and desktop widths, plus interaction tests (skip link, nav state, piece viewer, 404, contact form, reduced motion, 44px targets). CI runs it. When you add a route, add it to `tests/routes.ts`; when you add standalone controls, the touch-target test covers them.
- **Test fixtures:** `scripts/fixtures.mjs` writes `zz-fixture-*` content and removes only those paths afterwards. Never name real content `zz-fixture-*`. `pnpm test` leaves `.next` built with fixture content, so run `pnpm build` before `pnpm start` for real output.
- **Formatting:** `pnpm format` (Prettier with the Tailwind plugin). CI runs `format:check`.
