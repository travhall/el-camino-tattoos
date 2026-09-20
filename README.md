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

Color comes from three tonal ramps built from the brand colors and exposed as semantic roles (`background`, `foreground`, `accent`, ...) for light and dark. `scripts/color-ramps.mjs` checks every role pairing against WCAG contrast and refuses to generate if one fails. To change the palette, edit the pinned colors there and run:

```bash
pnpm color-ramps
```

The type scale is fluid and modular: a perfect fourth (1.333) on wide screens easing to a major third (1.2) on phones, with body text from 16px to 18px. To change it, edit the config in `scripts/type-scale.mjs` and run:

```bash
pnpm type-scale
```

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
