# El Camino Tattoos

Portfolio site for El Camino Tattoos. Next.js (App Router), React, Tailwind CSS, TypeScript. Content managed with Keystatic (files in this repo). Hosted on Netlify.

## Development

```bash
nvm use          # Node 22 (see .nvmrc)
pnpm install
pnpm dev         # http://localhost:3000, admin at /keystatic
pnpm lint
pnpm format
pnpm check:images
pnpm build
```

Fonts: Cosmic (variable, headings and display) via `next/font/local`, and Hanken Grotesk (variable, body) via `next/font/google`.

## Styling

Markup uses semantic classes, and Tailwind utilities are applied inside them with `@apply`. See `src/styles/` and the conventions in `CLAUDE.md`. Browse everything at `/styleguide`.

Color is primitives mapped to roles. `scripts/color-ramps.mjs` generates tonal ramps (`paper`, `ink`, `gold`, `red`, `green`, `navy`) from pinned brand values into `src/styles/palette.css`. Semantic roles (`background`, `foreground`, `accent`, `highlight`, ...) are hand-edited in `src/styles/roles.css`, for light and dark, and update live in the browser with no build step. To change a role, edit that file. To change a brand value, edit the pins in the generator and run:

```bash
pnpm color-ramps
```

`pnpm check:contrast` measures every role pairing against WCAG contrast. It reports and never blocks; CI runs it, and `/styleguide` shows the same numbers.

The type scale is fluid and modular: a perfect fourth (1.333) on wide screens easing to a major third (1.2) on phones, with body text from 16px to 18px. The same generator produces the fluid space scale (`gap-fluid-md`, `p-fluid-lg`, ...). To change either, edit the config in `scripts/type-scale.mjs` and run:

```bash
pnpm type-scale
```

## Testing

```bash
pnpm exec playwright install chromium   # once
pnpm test                               # seeds fixtures, builds, runs Playwright, cleans up
pnpm test --grep "touch targets"        # extra args go to Playwright
```

The suite runs axe-core (WCAG 2.0 to 2.2 A/AA) on every route in light and dark at phone and desktop widths, plus interaction tests for the skip link, nav state, piece viewer, 404, contact form, reduced motion and touch-target sizes. CI runs it on every push and pull request, and uploads the Playwright report when it fails.

## Contact form and analytics

The contact form uses Netlify Forms. Netlify reads `public/__forms.html` at deploy time to register the form, and `src/components/contact-form.tsx` posts to it. Submissions appear in the Netlify dashboard. This needs a first deploy to verify end to end.

Analytics (Cloudflare Web Analytics, cookieless) loads only when `CLOUDFLARE_ANALYTICS_TOKEN` is set in Netlify, so local dev and previews aren't tracked.

## Content

Artists and portfolio pieces live in `content/`, and their images in `public/images/`. Edit them in the admin at `/keystatic`.

- **Locally:** the admin writes straight to your working tree.
- **In production:** the admin commits to GitHub (`travhall/el-camino-tattoos`), and Netlify rebuilds from the commit.

Image guidance for editors: about 2400px on the long edge, under 1.5MB. `pnpm check:images` flags anything larger. CI fails on it, and the Netlify build only warns.

## Deploying to Netlify (one-time setup)

1. **Create the Keystatic GitHub App.** Run `NEXT_PUBLIC_KEYSTATIC_STORAGE=github pnpm dev`, open `/keystatic`, and follow the setup wizard. It writes the four `KEYSTATIC_*` values to a local `.env` (see `.env.example`).
2. **Import the repo in Netlify.** `netlify.toml` sets the build command and Node version.
3. **Add the four env vars** from step 1 in Netlify: Site configuration > Environment variables.
4. **Update the GitHub App's URLs** to the deployed site once the Netlify URL or custom domain is known. Set the callback URL to `https://<site>/api/keystatic/github/oauth/callback`.
5. **Give editors access:** add them as collaborators on the GitHub repo. They sign in to `/keystatic` with GitHub.
