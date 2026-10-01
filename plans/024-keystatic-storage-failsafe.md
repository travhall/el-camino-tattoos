# Plan 024: Fail the build if Keystatic would deploy unauthenticated

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 23ebb10..HEAD -- keystatic.config.ts`
> If that file changed since this plan was written, compare the "Current
> state" excerpt below against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `23ebb10`, 2026-09-30

## Why this matters

`keystatic.config.ts` picks a storage backend at module-load time:
GitHub-backed (requires OAuth login to edit content) if
`NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` is set, otherwise `{ kind: "local" }`
— which means the `/keystatic` admin UI and its API route
(`src/app/api/keystatic/[...params]/route.ts`) accept content writes with
**no authentication at all**, straight to the server's filesystem.

Local mode is correct for local dev and CI. The problem is that nothing in
the code enforces "this must never be local mode once deployed." If the
GitHub App env var is ever missing on a real deploy — a fresh Netlify site
created without following the README's setup steps, an env var that didn't
copy over during a site migration, a typo in the variable name, a new
branch/preview-deploy context that doesn't inherit production env vars —
the site silently serves a public, unauthenticated content-editing API.
Nobody would notice until someone found `/keystatic` and started editing.

Netlify sets the `NETLIFY=true` environment variable in every build and
runtime context on its platform (this is documented, standard Netlify
behavior — not something local `next dev`, local `next build`, or a
generic CI runner sets). That makes it a reliable signal for "this code is
actually running on Netlify," independent of `NODE_ENV`, which is also
`"production"` for an ordinary local production build test.

This plan adds one guard: if the code is running on Netlify and GitHub
storage isn't configured, throw at config-evaluation time. Netlify's build
step evaluates `keystatic.config.ts` while prerendering every page (every
page imports it transitively through `src/lib/content.ts`), so this fails
the whole `next build` loudly instead of deploying an insecure site. Local
dev, local production builds, and any other CI runner are unaffected
because they never set `NETLIFY=true`.

## Current state

`keystatic.config.ts`, lines 1-50 (the relevant head of the file):

```ts
import { collection, config, fields, singleton } from "@keystatic/core";

// Once the GitHub App exists, its public slug is set (in Netlify), and edits
// commit to GitHub, which triggers a rebuild. Without it (local dev, CI),
// edits write straight to the working tree. The slug is a NEXT_PUBLIC_ var so
// the client and server bundles agree. To run the one-time GitHub App setup
// from `pnpm dev`, set NEXT_PUBLIC_KEYSTATIC_STORAGE=github.
const useGitHub =
  Boolean(process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG) ||
  process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === "github";

const instagramField = () =>
  fields.text({
    label: "Instagram handle",
    description: "Without the @.",
    validation: {
      pattern: {
        regex: /^[A-Za-z0-9._]{0,30}$/,
        message: "Letters, numbers, periods and underscores only.",
      },
    },
  });

// ... (richText helper, unrelated, omitted here — do not touch it)

export default config({
  storage: useGitHub
    ? { kind: "github", repo: { owner: "travhall", name: "el-camino-tattoos" } }
    : { kind: "local" },

  ui: {
    brand: { name: "El Camino Tattoos" },
    navigation: {
      // ... (unrelated, omitted here)
```

This file is imported by three files, confirmed by
`grep -rln "keystatic.config" src --include="*.ts" --include="*.tsx"`:

- `src/app/keystatic/keystatic.tsx` (the admin UI entry)
- `src/app/api/keystatic/[...params]/route.ts` (the admin API route)
- `src/lib/content.ts` (the content reader every page uses — `getArtists`,
  `getSite`, etc. all go through `reader.collections`/`reader.singletons`,
  which is built from this config)

Because `src/lib/content.ts` is imported by nearly every page, this
module's top-level code runs during Netlify's `next build`, which is
exactly what makes a top-level throw here an effective build-time gate.

`.env.example` (the four GitHub-mode variables, for reference — do not
change this file):

```
KEYSTATIC_GITHUB_CLIENT_ID=
KEYSTATIC_GITHUB_CLIENT_SECRET=
KEYSTATIC_SECRET=
NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=
```

## Commands you will need

| Purpose                           | Command                  | Expected on success       |
| --------------------------------- | ------------------------ | ------------------------- |
| Typecheck                         | `pnpm exec tsc --noEmit` | exit 0, no errors         |
| Lint                              | `pnpm lint`              | exit 0                    |
| Format check                      | `pnpm format:check`      | exit 0                    |
| Build (local, no NETLIFY var set) | `pnpm build`             | exit 0, succeeds normally |
| Full test suite                   | `pnpm test`              | all pass                  |

## Scope

**In scope:**

- `keystatic.config.ts` — add the guard, nothing else in this file.

**Out of scope — do not touch:**

- `src/app/api/keystatic/[...params]/route.ts` and
  `src/app/keystatic/keystatic.tsx` — they don't need changes; the guard in
  the shared config file protects all three importers at once.
- `.env.example`, `netlify.toml`, or any Netlify dashboard configuration —
  this plan is a code-level fail-safe, not a change to the actual deployed
  environment variables (the user's own Netlify site should already have
  them set correctly; this guard only protects against _future_
  misconfiguration).
- `src/lib/content.ts` — unrelated to this fix.

## Git workflow

Work in your isolated worktree. One commit for this change (it's a single
small guard). Message style: conventional commits, matching this repo's
history, e.g. `fix(keystatic): fail the build instead of deploying
unauthenticated storage`. Do not merge, push, or touch any branch besides
your own worktree's.

## Steps

### Step 1 — Add the guard

In `keystatic.config.ts`, immediately after the `useGitHub` constant
(after the two-line expression ending in
`process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === "github";`), add:

```ts
// Netlify sets NETLIFY=true in every build and runtime context on its
// platform (local dev, local `next build`, and other CI runners never set
// this). If GitHub storage isn't configured there, Keystatic would fall
// back to local-filesystem storage — meaning /keystatic and its API route
// accept unauthenticated content writes in production. Fail the build
// loudly instead of deploying that silently.
if (process.env.NETLIFY && !useGitHub) {
  throw new Error(
    'Keystatic storage would be "local" on Netlify, which serves an ' +
      "unauthenticated content-editing API in production. Set " +
      "NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG (see .env.example and the " +
      "README's Netlify setup section) before deploying.",
  );
}
```

Do not change the `useGitHub` constant itself, the `storage:` field below
it, or anything else in the file.

**Verify:**

```bash
pnpm exec tsc --noEmit
```

Expect exit 0, no new errors.

### Step 2 — Confirm the guard doesn't fire locally

```bash
pnpm build
```

Expect this to succeed exactly as it did before your change (your local
shell doesn't have `NETLIFY` set, so the guard is inert here). If your
local environment happens to already have a `NETLIFY` variable set for
some unrelated reason, note that in your report — don't work around it by
weakening the guard.

### Step 3 — Confirm the guard actually fires

Run the build once with `NETLIFY` set and `useGitHub` false (the default
state of this repo's `.env` — no GitHub App slug configured), to prove the
guard works:

```bash
NETLIFY=true pnpm build
```

Expect this to **fail** with the exact error message from Step 1, thrown
during the build (not a generic Next.js crash — confirm the message text
appears in the output).

Then confirm the guard does NOT fire when GitHub storage _is_ configured:

```bash
NETLIFY=true NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=test-app pnpm build
```

This should get past the guard (it may still fail later for unrelated
reasons — e.g. Keystatic's GitHub client trying to reach a real GitHub App
that doesn't exist — that's fine and expected; you're only confirming the
guard itself doesn't block a correctly-configured deploy). If it fails with
the same thrown error message from Step 1, the guard's condition is wrong —
STOP and report rather than loosening it.

### Step 4 — Full verification pass

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm format:check
pnpm test
```

All must exit 0 (run without `NETLIFY` set, matching this repo's normal
local/CI test environment).

## Test plan

This is a config-level guard, not application behavior — there is no
Playwright test to add (the test suite doesn't run with `NETLIFY` set, and
shouldn't start doing so just for this). The verification is Step 3's two
manual build invocations, which you run once during execution and report
the output of, rather than a permanent automated test. Note this
explicitly in your report so a reviewer knows it was checked, not skipped.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` and `pnpm format:check` exit 0
- [ ] `pnpm build` (no `NETLIFY` var) succeeds, unchanged from before
- [ ] `NETLIFY=true pnpm build` fails with the guard's exact error message
- [ ] `NETLIFY=true NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=test-app pnpm build`
      does NOT fail with the guard's error message (gets past the guard)
- [ ] `pnpm test` exits 0, unaffected by this change
- [ ] No files outside `keystatic.config.ts` modified
- [ ] `plans/README.md` status row updated for plan 024

## STOP conditions

- If `keystatic.config.ts`'s `useGitHub` logic has changed since this plan
  was written (drift check above), re-verify the guard's placement still
  makes sense before adding it — don't paste it in blindly.
- If `NETLIFY=true pnpm build` does NOT fail in Step 3 (the guard doesn't
  fire when it should), STOP and report — do not weaken or remove the
  guard to make the build pass.
- If you find any other place that reads Keystatic's storage config
  independently of this file (so the guard wouldn't cover it), STOP and
  report that location instead of trying to patch it yourself — this
  plan's blast-radius assumption (three importers, all going through this
  one config) would be wrong.

## Maintenance notes

- If this project ever adds a second deployment target besides Netlify
  (Vercel, a VPS, etc.), this guard needs a second environment-variable
  check for that platform's equivalent of `NETLIFY=true` — it currently
  only protects the Netlify path, which is the only one this repo deploys
  to today (see `netlify.toml`, `README.md`'s "Deploying to Netlify"
  section).
- This guard protects against _accidental_ misconfiguration, not a
  determined attacker who controls the deploy environment — that's a
  different threat model (supply-chain/CI compromise) and out of scope
  here.
