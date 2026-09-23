# Plan 001: Make Button's disabled state inert and add an accessible `pending` state

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 7cbf391..HEAD -- src/components/ui/button.tsx src/styles/components.css src/components/contact-form.tsx "src/app/(site)/styleguide/page.tsx" tests/interactions.spec.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW-MED
- **Depends on**: none
- **Category**: bug + a11y
- **Planned at**: commit `7cbf391`, 2026-09-23 (revised 2026-09-23: Step 2 no longer adds an `onClick` guard; see the note in Step 2)
- **Resume note**: a first attempt exists on branch `advisor/001-button-disabled-pending` (worktree `.claude/worktrees/friendly-newton-582903`) with one commit, `de1e0e8`, that completes Step 3 (CSS only). If that branch exists, continue on it: keep the CSS commit, re-run Step 3's Verify, then do Steps 1, 2, 4, 5, 6 as written. Otherwise start from Step 1.

## Why this matters

Two problems with how the Button behaves while it can't be used:

1. **Disabled buttons still react to hover.** The base `.button` rule has `hover:bg-foreground/85` and each variant has its own `hover:bg-*`, while the disabled rule only lowers opacity. A disabled secondary or ghost button gets a hover fill and looks clickable. (The styleguide only shows a disabled _primary_, so it never shows this.)
2. **The contact form's submit button uses native `disabled` while sending.** Files can be uploaded (up to a combined size limit), so the "sending" window can be several seconds. A natively disabled button can lose keyboard focus, and swapping its label to "Sending…" is not announced to screen reader users. The standard fix is `aria-disabled` + `aria-busy` (button stays focusable) plus a polite live region.

After this plan: disabled and pending buttons show no hover change; `Button` has a `pending` prop; the contact form keeps focus on its submit button while sending and announces the state.

## Current state

Files and their roles:

- `src/components/ui/button.tsx` — `Button`, `ButtonLink`, `buttonClasses`. Styles live in CSS, not here.
- `src/styles/components.css` — `.button`, `.button--secondary|accent|ghost|sm|lg` (lines ~46-71), inside `@layer components`.
- `src/components/contact-form.tsx` — the only form that submits with a `Button`.
- `src/app/(site)/styleguide/page.tsx` — `/styleguide` "Buttons" section (~lines 261-280). Project rule: new UI states go in the styleguide.
- `tests/interactions.spec.ts` — Playwright interaction tests (`pnpm test`).

`src/components/ui/button.tsx` today (lines 24-42):

```tsx
type Options = { variant?: Variant; size?: Size };

export function buttonClasses({ variant = "primary", size = "md" }: Options = {}) { … }

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: Options & React.ComponentPropsWithoutRef<"button">) {
  return (
    <button
      type={type}
      className={[buttonClasses({ variant, size }), className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
```

`src/styles/components.css` today (lines 46-71):

```css
  .button {
    @apply inline-flex min-h-11 items-center justify-center rounded-full border border-transparent bg-foreground px-4 py-1.5 font-medium text-background transition-colors hover:bg-foreground/85 disabled:opacity-50 motion-reduce:transition-none;
    transition-duration: var(--duration-fast);
  }

  .button--secondary {
    @apply border border-outline bg-transparent text-foreground hover:bg-hover;
  }

  .button--accent {
    @apply bg-accent text-accent-foreground hover:bg-accent/85;
  }

  .button--ghost {
    @apply bg-transparent text-foreground hover:bg-hover;
  }
```

`src/components/contact-form.tsx`:

- line 31: `const [status, setStatus] = useState<Status>({ state: "idle" });` — `Status.state` is `"idle" | "sending" | "error"` (check the `Status` type at the top of the file).
- `onSubmit` (line ~33) calls `event.preventDefault()`, then sets `{ state: "sending" }` before `fetch`.
- lines ~233-243:

```tsx
      {status.state === "error" && (
        <p role="alert" className="form-status">
          <strong>Something went wrong.</strong> {status.message}
        </p>
      )}

      <div>
        <Button type="submit" disabled={status.state === "sending"}>
          {status.state === "sending" ? "Sending…" : "Send message"}
        </Button>
      </div>
```

Repo conventions that apply (from `CLAUDE.md`, inlined because you have not read it):

- **Semantic classes in markup, utilities in CSS.** Style with `@apply` inside the existing `.button*` rules in `components.css`. Do not add utility classes to JSX.
- State is styled from attributes (`[aria-disabled]`, `[aria-busy]`, `:disabled`), not conditional class names.
- Never write hex colors or hue names; use existing roles (`bg-hover`, `bg-foreground`, …).
- Focus uses `:focus-visible` outline from `globals.css`; do not change it.
- Motion: global `prefers-reduced-motion` rule already collapses transitions to 0.01ms.
- Tailwind is v4.3.3 (`aria-disabled:`, `not-*:` variants exist).
- `.visually-hidden` (in `layout.css`) hides text from sighted users but keeps it for assistive tech.
- Next.js in this repo is v16 with breaking changes; you are not touching Next APIs here, so no docs reading is needed.

## Commands you will need

| Purpose   | Command                                            | Expected on success                    |
| --------- | -------------------------------------------------- | -------------------------------------- |
| Install   | `pnpm install`                                     | exit 0                                 |
| Typecheck | `pnpm exec tsc --noEmit`                           | exit 0, no output                      |
| Lint      | `pnpm lint`                                        | exit 0                                 |
| Format    | `pnpm format:check` (fix with `pnpm format`)       | exit 0                                 |
| Tests     | `pnpm test` (seeds fixtures, builds, runs Playwright) | all tests pass                      |
| One test  | `pnpm test --grep "<title fragment>"`              | matching tests pass                    |

Use `pnpm` only (never npm/npx). `pnpm test` leaves `.next` built with fixture content; that is expected.

## Scope

**In scope** (the only files you should modify):

- `src/components/ui/button.tsx`
- `src/styles/components.css` (only the `.button*` rules)
- `src/components/contact-form.tsx`
- `src/app/(site)/styleguide/page.tsx` (Buttons section only)
- `tests/interactions.spec.ts`

**Out of scope** (do NOT touch):

- `src/components/site-header.tsx`, `piece-viewer-dialog.tsx`, error/not-found components — other `Button` callers; they must keep working unchanged.
- `src/styles/palette.css`, `type-scale.css`, and their `*.generated.json` — generated, never hand-edited.
- The `ref` typing and class-merge cleanup in `button.tsx` — that is plan 002. Do not do it here.
- `.button--sm` height (36px) — a deliberate, documented tradeoff.
- Any hex color or new color token.

## Git workflow

- Branch: `advisor/001-button-disabled-pending`.
- Commit per step or logical unit, conventional commits as in `git log` (e.g. `fix(button): stop hover styles on disabled buttons`, `feat(button): add pending state`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Show disabled variants in the styleguide (reproduce the bug)

In `src/app/(site)/styleguide/page.tsx`, Buttons section, replace the single `<Button disabled>Disabled</Button>` with one disabled button per variant, and add a pending example. Target shape (keep the surrounding `cluster` divs and existing buttons):

```tsx
        <div className="cluster">
          <Button disabled>Primary disabled</Button>
          <Button variant="secondary" disabled>
            Secondary disabled
          </Button>
          <Button variant="accent" disabled>
            Accent disabled
          </Button>
          <Button variant="ghost" disabled>
            Ghost disabled
          </Button>
          <Button pending>Pending</Button>
        </div>
```

(`pending` does not exist yet, so typecheck will fail until Step 2. That is expected.)

**Verify**: nothing to run yet; continue to Step 2.

### Step 2: Add the `pending` prop to `Button`

In `src/components/ui/button.tsx`, change only the `Button` function to this shape (leave `buttonClasses`, `ButtonLink`, types and the top-of-file constants alone):

```tsx
export function Button({
  variant,
  size,
  className,
  type = "button",
  pending = false,
  ...props
}: Options &
  React.ComponentPropsWithoutRef<"button"> & {
    /**
     * Busy but still focusable: use instead of `disabled` while work is in
     * flight. This only sets aria-busy/aria-disabled and the styling; it does
     * NOT block activation, so the caller must ignore activations while pending.
     */
    pending?: boolean;
  }) {
  return (
    <button
      type={type}
      className={[buttonClasses({ variant, size }), className]
        .filter(Boolean)
        .join(" ")}
      aria-busy={pending || undefined}
      aria-disabled={pending || undefined}
      {...props}
    />
  );
}
```

**Do NOT add an `onClick` (or any function prop) inside `Button`, and do NOT add `"use client"` to this file.** `Button` is rendered from server components (`styleguide/page.tsx`, error/not-found content) and `buttonClasses` is called from server components (`site-header.tsx`); a function prop on `<button>` inside a server component is a React error, and `"use client"` would turn `buttonClasses` into a client reference that server components cannot call. (A first attempt at this plan did add an `onClick` guard and was blocked for exactly this reason.) The submit guard lives in the form's `onSubmit` instead (Step 4).

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 3: Make disabled and pending inert in CSS

In `src/styles/components.css`, edit only the `.button*` rules so that:

- Both `:disabled` and `[aria-disabled="true"]` get `opacity-50` (add `aria-disabled:opacity-50` next to `disabled:opacity-50`).
- No `hover:` background applies when the button is `:disabled` or `[aria-disabled="true"]`. This must work for `<a>` links too (`ButtonLink`), so do NOT use `enabled:` (it never matches `<a>`). Recommended: prefix every hover background in `.button`, `.button--secondary`, `.button--accent`, `.button--ghost` with `not-disabled:not-aria-disabled:` — e.g. `not-disabled:not-aria-disabled:hover:bg-foreground/85`. If Tailwind rejects or mis-generates that variant (see verify), fall back to plain CSS: keep the hover utilities out of `@apply` and write `.button:not(:disabled, [aria-disabled="true"]):hover { background-color: … }` per variant using the same role colors (check `src/styles/theme.css` for the exact variable names before using them).

**Verify**: `pnpm build` → exit 0. Then check the generated CSS really excludes hover for disabled: `grep -rho "\.button[^{]*hover[^{]*{" .next/static/chunks/*.css | head` and confirm the selectors include a `:not(:disabled)` / `:not([aria-disabled=…])` guard (exact form depends on the approach). If the output shows plain `.button:hover` with no guard, the CSS is wrong — fix before continuing.

### Step 4: Use `pending` in the contact form and announce it

In `src/components/contact-form.tsx`:

1. In `onSubmit`, add a guard right after `event.preventDefault()`: `if (status.state === "sending") return;`. This guard is what blocks a second submit while pending (click or Enter), since `Button` itself does not block activation. Keep it AFTER `preventDefault()` so the browser never falls back to a native form POST.
2. Replace the submit block with:

```tsx
      <div>
        <Button type="submit" pending={status.state === "sending"}>
          {status.state === "sending" ? "Sending…" : "Send message"}
        </Button>
      </div>
      {/* Present before it changes so screen readers announce the update. */}
      <p role="status" className="visually-hidden">
        {status.state === "sending" ? "Sending your message…" : ""}
      </p>
```

Keep the existing `role="alert"` error block unchanged. Do not remove the visible label swap.

**Verify**: `pnpm exec tsc --noEmit && pnpm lint` → both exit 0.

### Step 5: Add tests

Add to `tests/interactions.spec.ts` (imports `expect`, `test`, `Page` and the `open` helper already exist at the top of the file):

1. **Top-level test** (near the "reduced motion" test), `disabled buttons ignore hover`:
   - `await page.emulateMedia({ reducedMotion: "reduce" });` so transitions collapse.
   - `await open(page, "/styleguide");`
   - Locate the enabled `Secondary` button and the `Secondary disabled` button with `page.getByRole("button", { name: ... })` (pending buttons carry `aria-disabled`; `getByRole` still finds them).
   - Read `backgroundColor` via `evaluate(el => getComputedStyle(el).backgroundColor)` before and after `hover()` (use `hover({ force: true })` for the disabled one). Assert the enabled one CHANGES and the disabled one and the `Pending` one do NOT.
2. **Inside `test.describe("contact form")`**, `keeps focus and announces while sending`:
   - Intercept `**/__forms.html`; for POST, wait on a promise you resolve later, then `route.fulfill({ status: 200, body: "" })`; count POSTs; other methods `route.continue()`.
   - `open`, `fillRequired(page)`, focus the submit button and press `Enter` (keyboard submit).
   - While the POST is held: the button `toHaveAttribute("aria-disabled", "true")`, `toHaveAttribute("aria-busy", "true")`, `toBeFocused()`; `page.getByRole("status").filter({ hasText: "Sending your message" })` has that text; press `Enter` again and assert the POST count is still 1.
   - Release the POST; `await expect(page).toHaveURL(/\/contact\/thanks$/)`.
3. Extend the existing `announces a failed send and lets the visitor retry` test: after the alert, also `await expect(button).not.toHaveAttribute("aria-disabled", "true")`.

Model on the existing tests in the same file (`refuses images over the size limit without posting` for the route-interception style).

**Verify**: `pnpm test --grep "disabled buttons ignore hover|keeps focus and announces|failed send"` → all matched tests pass.

### Step 6: Full suite

**Verify** (all must exit 0): `pnpm lint`, `pnpm format:check`, `pnpm exec tsc --noEmit`, `pnpm test`.
`pnpm test` includes axe on `/styleguide` and `/contact` in light and dark at two widths; it must stay green (the live region must not be flagged, and the pending/disabled examples must not introduce violations).

## Test plan

Covered in Step 5: hover-inertness test (enabled control vs disabled vs pending), contact-form pending behavior test (focus kept, aria attributes, live region, no double POST, completes to thanks page), and the retry test extended to assert the pending state clears. Existing axe sweep and the 44px touch-target test cover regressions in markup and sizing.

## Done criteria

ALL must hold:

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0 and `pnpm format:check` exits 0
- [ ] `pnpm test` exits 0, including the 2 new tests and the extended retry test
- [ ] `grep -n "pending" src/components/ui/button.tsx` shows the `pending` prop and both aria attributes
- [ ] `grep -n "disabled=" src/components/contact-form.tsx` returns no matches (native `disabled` no longer used on the submit button)
- [ ] `grep -n "#[0-9a-fA-F]\{3,8\}" src/styles/components.css` returns no new hex values
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts.
- Neither `not-disabled:not-aria-disabled:hover:` nor the plain-CSS fallback produces a hover-free disabled button after two attempts.
- `pnpm build` or `pnpm test` fails with an error about event handlers / functions being passed to Client Components, or `tsc` shows `"use client"` is needed — that means a function prop or client-only code leaked into `Button`; remove it rather than adding `"use client"`.
- The form-level `onSubmit` guard does not prevent a second POST (the double-POST assertion fails after one fix attempt) — report.
- The axe sweep flags the new live region or the pending/disabled styleguide examples and the fix would need a color change.
- Any step requires touching an out-of-scope file.

## Maintenance notes

- Any new async button (future booking flow, uploads) should use `pending`, not `disabled`, so focus survives and the label change is paired with a live region.
- `pending` is presentational and semantic only (aria + styling); every caller must ignore activations while pending, as `ContactForm.onSubmit` does. That is deliberate: `Button` must stay a server-compatible component with no handlers. `ButtonLink` has no pending state.
- If a color role for "disabled" is ever added to `scripts/color-ramps.mjs`, revisit the `opacity-50` approach.
- Reviewer should scrutinize: the generated CSS selectors for hover on disabled/aria-disabled, and that the sr-only live region is always in the DOM (not conditionally rendered).
- Deferred: `ref` typing and class-merge dedupe → plan 002.
