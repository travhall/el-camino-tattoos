# Plan 002: Let Button/ButtonLink take a `ref` and remove the duplicated class merge

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: this plan depends on plan 001 being merged.
> Run `grep -n "pending" src/components/ui/button.tsx`. If it prints nothing,
> plan 001 has not landed: STOP and tell the operator to land 001 first
> (both plans edit `Button`, and this one is written against the post-001 shape).
> Then: `git diff --stat 7cbf391..HEAD -- src/components/ui/button.tsx src/components/site-header.tsx`
> Differences from plan 001 are expected in `button.tsx`; anything else, compare
> against "Current state" and STOP on a real mismatch.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-button-disabled-and-pending-states.md
- **Category**: tech-debt
- **Planned at**: commit `7cbf391`, 2026-09-23 (written against the code as plan 001 specifies it)

## Why this matters

1. `Button` and `ButtonLink` type their props with `React.ComponentPropsWithoutRef`, which strips `ref`. React 19 (this repo is on 19.3.0) passes `ref` as an ordinary prop, so allowing it is free and lets callers focus or measure a button without a wrapper. Today, `<Button ref={r}>` is a type error.
2. The class-merge expression `[buttonClasses({ variant, size }), className].filter(Boolean).join(" ")` is copy-pasted in `Button` and `ButtonLink`, and `site-header.tsx` bypasses `ButtonLink` to call `buttonClasses()` on a raw `Link`. One merge point and one way to render a link-button keeps the three in sync when variants change.

No behavior change for users.

## Current state

- `src/components/ui/button.tsx` — after plan 001 lands, it looks like this (only the parts this plan touches):

```tsx
type Options = { variant?: Variant; size?: Size };

export function buttonClasses({
  variant = "primary",
  size = "md",
}: Options = {}) {
  return ["button", variants[variant], sizes[size]].filter(Boolean).join(" ");
}

export function Button({
  variant, size, className, type = "button", pending = false, ...props
}: Options &
  React.ComponentPropsWithoutRef<"button"> & { pending?: boolean }) {
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

export function ButtonLink({
  variant, size, className, ...props
}: Options & React.ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      className={[buttonClasses({ variant, size }), className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
```

- `src/components/site-header.tsx`, lines ~4 and ~28:

```tsx
import { buttonClasses } from "@/components/ui/button";
…
          <Link href="/contact" className={buttonClasses()}>
            Book
          </Link>
```

  `Link` is still needed in this file for the brand link (`<Link href="/" className="site-header__brand">`), so keep that import.

- `buttonClasses` is imported only by `site-header.tsx` (verify with grep in Step 1). Decision: **keep `buttonClasses` exported** (it is useful for future non-`<a>`/non-`<button>` elements); only add a `className` option to it.

Conventions: `CLAUDE.md` says semantic classes in markup, no inline utility classes. This plan adds none. Use `pnpm` only.

## Commands you will need

| Purpose   | Command                  | Expected on success             |
| --------- | ------------------------ | ------------------------------- |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0, no output               |
| Lint      | `pnpm lint`              | exit 0                          |
| Format    | `pnpm format:check`      | exit 0 (fix with `pnpm format`) |
| Tests     | `pnpm test`              | all pass                        |

## Scope

**In scope** (the only files you should modify):

- `src/components/ui/button.tsx`
- `src/components/site-header.tsx`

You may create and then DELETE one scratch file, `src/components/ui/zz-ref-check.tsx`, in Step 2. It must not exist when you finish.

**Out of scope** (do NOT touch):

- Any CSS (`src/styles/*`) — class names are unchanged.
- The `pending`/`aria-*` logic in `Button` (plan 001). Move nothing there, change nothing there. Do not add any function prop or `"use client"` to `button.tsx` (it is rendered and called from server components).
- Other `Button`/`ButtonLink` callers — they must compile unchanged.
- `tests/*` — existing tests are the regression net; no new test is needed for a type-level change.

## Git workflow

- Branch: `advisor/002-button-cleanup`.
- Conventional commits, e.g. `refactor(button): merge class names in one place and allow ref`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Baseline

Run `grep -rn "buttonClasses" src tests`. Expect matches only in `src/components/ui/button.tsx` and `src/components/site-header.tsx`. Run `pnpm exec tsc --noEmit`.

**Verify**: grep shows only those two files; tsc exits 0. If another file uses `buttonClasses`, that is fine (nothing is being removed), but note it in your report.

### Step 2: Write a failing type check for `ref`

Create `src/components/ui/zz-ref-check.tsx`:

```tsx
import { createRef } from "react";
import { Button, ButtonLink } from "./button";

export const buttonRef = createRef<HTMLButtonElement>();
export const linkRef = createRef<HTMLAnchorElement>();

export const a = <Button ref={buttonRef}>x</Button>;
export const b = (
  <ButtonLink href="/" ref={linkRef}>
    x
  </ButtonLink>
);
```

**Verify**: `pnpm exec tsc --noEmit` → FAILS with errors mentioning `ref` on `Button` and/or `ButtonLink`. If it passes already, STOP (the premise is wrong).

### Step 3: Allow `ref` and centralize the class merge

In `src/components/ui/button.tsx`:

1. Give `buttonClasses` an optional `className` and make it the single merge point:

```tsx
type Options = { variant?: Variant; size?: Size };

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: Options & { className?: string } = {}) {
  return ["button", variants[variant], sizes[size], className]
    .filter(Boolean)
    .join(" ");
}
```

2. In `Button` and `ButtonLink`, replace `React.ComponentPropsWithoutRef<…>` with `React.ComponentProps<…>` (so `ref` is included; React 19 forwards it through the `...props` spread), and replace the copied merge with `className={buttonClasses({ variant, size, className })}`. Keep the `pending` prop type and the two `aria-*` lines of `Button` exactly as plan 001 left them.

**Verify**: `pnpm exec tsc --noEmit` → exit 0 (the scratch file now compiles).

### Step 4: Delete the scratch file

`rm src/components/ui/zz-ref-check.tsx`

**Verify**: `git status --short` does not list `zz-ref-check.tsx`; `pnpm exec tsc --noEmit` → exit 0.

### Step 5: Header uses `ButtonLink`

In `src/components/site-header.tsx`: change the import to `import { ButtonLink } from "@/components/ui/button";` and replace the Book link with:

```tsx
          <ButtonLink href="/contact">Book</ButtonLink>
```

Keep the existing comment above it. Keep the `Link` import (brand link still uses it).

**Verify**: `pnpm exec tsc --noEmit && pnpm lint && pnpm format:check` → all exit 0. `grep -n "buttonClasses" src/components/site-header.tsx` → no matches.

### Step 6: Full suite

**Verify**: `pnpm test` → all pass (axe sweep, nav tests and 44px touch-target tests exercise the header Book button; markup must be unchanged: `<a class="button" href="/contact">`).

## Test plan

No new tests: this is a type-level and internal refactor. The scratch type check in Steps 2-4 proves the `ref` change (fails before, passes after) and is deleted. The existing Playwright suite guards rendered markup, header nav, and touch targets.

## Done criteria

ALL must hold:

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` and `pnpm format:check` exit 0
- [ ] `pnpm test` exits 0
- [ ] `grep -n "ComponentPropsWithoutRef" src/components/ui/button.tsx` returns no matches
- [ ] `grep -c '\.filter(Boolean)' src/components/ui/button.tsx` prints `1`
- [ ] `grep -n "buttonClasses" src/components/site-header.tsx` returns no matches
- [ ] `src/components/ui/zz-ref-check.tsx` does not exist
- [ ] `git status` shows only `button.tsx` and `site-header.tsx` modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Plan 001 has not landed (see the drift check).
- The scratch type check in Step 2 already passes before any change.
- `pnpm test` shows any markup or behavior difference on routes that render `Button`/`ButtonLink` or the header.
- A step appears to require editing CSS, tests, or another component.

## Maintenance notes

- If a new variant or size is added, `buttonClasses` is now the only place that assembles class names.
- Anyone adding a third element type (e.g. a `<summary>` styled as a button) should call `buttonClasses` directly rather than copying the merge.
- Reviewer should scrutinize: that plan 001's `pending`/`aria-*` code is untouched, and that the header markup is byte-identical after build.
