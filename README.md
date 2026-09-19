# El Camino Tattoos

Portfolio site for El Camino Tattoos. Next.js (App Router), React, Tailwind CSS, TypeScript. Content managed with Keystatic (files in this repo). Hosted on Netlify.

## Development

```bash
nvm use          # Node 22 (see .nvmrc)
npm install
npm run dev      # http://localhost:3000, admin at /keystatic
npm run lint
npm run check:images
npm run build
```

Fonts: Hanken Grotesk (variable) via `next/font/google`.

## Content

Artists and portfolio pieces live in `content/`, and their images in `public/images/`. Edit them in the admin at `/keystatic`.

- **Locally:** the admin writes straight to your working tree.
- **In production:** the admin commits to GitHub (`travhall/el-camino-tattoos`), and Netlify rebuilds from the commit.

Image guidance for editors: about 2400px on the long edge, under 1.5MB. `npm run check:images` flags anything larger. CI fails on it, and the Netlify build only warns.

## Deploying to Netlify (one-time setup)

1. **Create the Keystatic GitHub App.** Run `NEXT_PUBLIC_KEYSTATIC_STORAGE=github npm run dev`, open `/keystatic`, and follow the setup wizard. It writes the four `KEYSTATIC_*` values to a local `.env` (see `.env.example`).
2. **Import the repo in Netlify.** `netlify.toml` sets the build command and Node version.
3. **Add the four env vars** from step 1 in Netlify: Site configuration > Environment variables.
4. **Update the GitHub App's URLs** to the deployed site once the Netlify URL or custom domain is known. Set the callback URL to `https://<site>/api/keystatic/github/oauth/callback`.
5. **Give editors access:** add them as collaborators on the GitHub repo. They sign in to `/keystatic` with GitHub.
