# Plan 031: Footer closer to the mock (brand row, proportions, bottom bar)

**Planned at:** commit `ddc0f17`, 2026-10-01

**Executor preamble:** Read this entire plan before touching anything. Run
the drift check first. If it reports any difference, STOP and report back.

**Drift check:**

```bash
git diff --stat ddc0f17..HEAD -- src/components/site-footer.tsx src/components/shop-info.tsx src/lib/content.ts keystatic.config.ts content/site.yaml tests/site.spec.ts
```

Expected output: nothing, except changes from plans 024 (Netlify guard in
`keystatic.config.ts`) and 030 (new hero fields in `keystatic.config.ts`,
`content.ts`, `content/site.yaml`), which are fine. `src/styles/components.css`
may show plans 028-030. Plan 028 (container) must be merged:
`grep -n "page-width" src/styles/layout.css` must match. Run this plan
**after 030** if both are pending: they edit the same three content files, and
the second to land would otherwise need a trivial merge.

## Status

TODO

## Why this matters

Plan 023 gave the footer four labeled columns, but the reviewed mock's footer
(`.../el-camino-tattoo-website-design-DARK/src/components.tsx` `Footer`, and
`.site-footer`, `.footer-*` in `src/index.css`) has two more parts and
different proportions. Gaps, measured:

| Part          | Mock                                                                  | Project today                           |
| ------------- | --------------------------------------------------------------------- | --------------------------------------- |
| Brand row     | wordmark, a one-line tagline, an Instagram link pushed right, divider | the plain text "El Camino Tattoos" only |
| Column widths | `1.03fr 1.2fr 1.34fr 1fr` (contact column widest)                     | four equal columns                      |
| Nav column    | links in two columns                                                  | one column                              |
| Bottom bar    | `©` left, a sign-off ("Made to last.") right, with a rule above       | `©` only, no rule                       |

Owner decisions that bound this plan: **keep fonts** (no condensed face),
**gold not red** (any accent is `accent-mark`), **light mode unchanged** (the
mock inverts the footer to dark in paper mode; not ported). The mock's 9-11px
footer type and its "Design study" disclaimer line are **not** ported (too
small for accessibility; the disclaimer is mock-only); the footer keeps
`text-sm`.

## Current state

`src/components/site-footer.tsx` (excerpt):

```tsx
    <footer className="site-footer">
      <div className="site-footer__top">
        <p className="site-footer__name">{siteName}</p>
      </div>
      <div className="site-footer__grid">
        <div className="site-footer__col"> <h2 className="eyebrow">Find the shop</h2> <ShopAddress site={site} /> </div>
        <div className="site-footer__col"> <h2 className="eyebrow">Come on by</h2> <ShopHours site={site} /> {walk-in note} </div>
        <div className="site-footer__col"> <h2 className="eyebrow">Get in touch</h2> <ShopContact site={site} /> <ButtonLink href="/contact" className="site-footer__cta">Request an appointment</ButtonLink> </div>
        <nav aria-label="Footer" className="site-footer__col"> <h2 className="eyebrow">Take a look around</h2> <div className="site-footer__nav"> {navLinks.map(... NavLink className="site-footer__nav-link")} </div> </nav>
      </div>
      <p className="site-footer__copyright">© {new Date().getFullYear()} {siteName}</p>
    </footer>
```

`src/components/shop-info.tsx`: `ShopContact({ site })` renders an `<address>`
with phone, email and (if set) an Instagram link
(`https://instagram.com/${site.instagram}`, text `@handle`, class `link
shop-info__link`). It starts with
`if (!site.phone && !site.email && !site.instagram) return null;`.

`src/styles/components.css` footer rules (after plan 028):

```css
.site-footer {
  @apply mt-auto border-t border-line bg-surface-sunken;
}
.site-footer__top {
  @apply mx-auto w-(--page-width) pt-fluid-lg;
}
.site-footer__name {
  @apply font-medium text-foreground;
}
.site-footer__grid {
  @apply mx-auto grid w-(--page-width) gap-fluid-lg pt-fluid-md text-sm text-muted md:grid-cols-4;
}
.site-footer__col {
  @apply grid content-start gap-fluid-sm;
}
.site-footer__nav {
  @apply grid gap-fluid-2xs;
}
.site-footer__nav-link {
  @apply inline-flex min-h-11 items-center hover:underline;
}
.site-footer__copyright {
  @apply mx-auto w-(--page-width) py-fluid-sm text-sm text-muted;
}
```

`SiteLogo` (`src/components/site-logo.tsx`) is the inline SVG wordmark taking
`className`; the header uses it inside a home link
(`<Link href="/" className="site-header__brand"><SiteLogo className="site-header__logo" /><span className="visually-hidden">El Camino Tattoos</span></Link>`).

Existing footer tests (`tests/site.spec.ts`): the address text, the four
headings by name, and a link "Request an appointment" with `href="/contact"`
inside `getByRole("contentinfo")`. They must keep passing.

Conventions: BEM + `@apply` in `components.css`, roles only, no inline
utilities, 44px targets for standalone links.

## Commands you will need

| Purpose       | Command                                                    | Expected |
| ------------- | ---------------------------------------------------------- | -------- |
| Static checks | `pnpm exec tsc --noEmit && pnpm lint && pnpm format:check` | exit 0   |
| Contrast      | `pnpm check:contrast`                                      | exit 0   |
| Full suite    | `pnpm test`                                                | all pass |

## Scope

**In scope:** `src/components/site-footer.tsx`, `src/components/shop-info.tsx`
(one optional prop), `src/styles/components.css` (footer rules),
`keystatic.config.ts` + `src/lib/content.ts` + `content/site.yaml` (two new
fields), `tests/site.spec.ts`.

**Out of scope, do not touch:** the four column headings and their wording;
`navLinks`; light-theme values; `ShopContact`'s use on the contact page (must
render as before); the header; any hex or role value.

## Steps

### Step 1 — Two editable footer lines

In `keystatic.config.ts`, `site` singleton, add (after the fields plan 030
adds, or after `consultationNote` if 030 hasn't landed; before
`depositAmount`):

```ts
        footerTagline: fields.text({
          label: "Footer tagline",
          description: "A short line next to the logo in the footer.",
        }),
        footerSignoff: fields.text({
          label: "Footer sign-off",
          description: "A short line at the bottom right of the footer.",
        }),
```

In `src/lib/content.ts` add `footerTagline: string; footerSignoff: string;` to
`Site`, and `entry?.footerTagline ?? ""` / `entry?.footerSignoff ?? ""` to
`getSite`. In `content/site.yaml` (placeholder content) add:

```yaml
footerTagline: Good work. Good company. Downtown Eau Claire, Wisconsin.
footerSignoff: Made to last.
```

**Verify:** `pnpm exec tsc --noEmit` exits 0.

### Step 2 — Brand row and bottom bar markup

In `shop-info.tsx`, give `ShopContact` an optional prop
`showInstagram?: boolean` (default `true`). When false, don't render the
Instagram link, and compute the early return from phone/email only. Everything
else stays the same (the contact page is unchanged).

In `site-footer.tsx` (import `Link` from `next/link` and `SiteLogo`):

- Replace the `site-footer__top` contents with:

```tsx
<div className="site-footer__top">
  <Link href="/" className="site-footer__brand">
    <SiteLogo className="site-footer__logo" />
    <span className="visually-hidden">{siteName}</span>
  </Link>
  {site.footerTagline && (
    <p className="site-footer__tagline">{site.footerTagline}</p>
  )}
  {site.instagram && (
    <a
      href={`https://instagram.com/${site.instagram}`}
      rel="noopener noreferrer"
      className="link site-footer__social"
    >
      Find us on Instagram (@{site.instagram})
    </a>
  )}
</div>
```

- Pass `showInstagram={false}` to the footer's `<ShopContact>` so the handle isn't listed twice.
- Replace the copyright paragraph with:

```tsx
<div className="site-footer__bottom">
  <p>
    © {new Date().getFullYear()} {siteName}
  </p>
  {site.footerSignoff && (
    <p className="site-footer__signoff">{site.footerSignoff}</p>
  )}
</div>
```

### Step 3 — Footer styles

In `components.css`, edit the footer rules in place (no duplicates):

```css
.site-footer__top {
  @apply mx-auto flex w-(--page-width) flex-wrap items-center gap-x-fluid-xl gap-y-fluid-sm border-b border-line pt-fluid-xl pb-fluid-md;
}
.site-footer__brand {
  @apply inline-flex min-h-11 items-center text-foreground;
}
.site-footer__logo {
  @apply h-6 w-auto;
}
.site-footer__tagline {
  @apply text-sm text-muted;
}
.site-footer__social {
  @apply inline-flex min-h-11 items-center text-sm md:ml-auto;
}
.site-footer__nav {
  @apply grid grid-cols-2 gap-x-fluid-md gap-y-fluid-3xs;
}
.site-footer__bottom {
  @apply mx-auto flex w-(--page-width) flex-wrap items-center justify-between gap-fluid-xs border-t border-line py-fluid-sm text-sm text-muted;
}
.site-footer__signoff {
  @apply italic;
}
```

And in `.site-footer__grid` replace `md:grid-cols-4` with
`md:grid-cols-[1.03fr_1.2fr_1.34fr_1fr]` and `pt-fluid-md` with
`py-fluid-lg`.

Remove `.site-footer__name` and `.site-footer__copyright` (now unused); first
run `grep -rn "site-footer__name\|site-footer__copyright" src tests` and
update any test hit.

**Verify (`pnpm dev`, `/`):** at 1440 wide the footer shows the logo and the
tagline, a rule, four columns with a wider third column and the nav in two
columns, a rule, then `©` and the sign-off on one row. `instagram` is empty in
the committed `content/site.yaml`, so the Instagram link is hidden; to check
it, set it temporarily in the Keystatic admin or YAML, then revert. At 375 it
stacks with no horizontal scroll. Run `pnpm check:contrast`.

### Step 4 — Test

In `tests/site.spec.ts`, after "the footer groups shop details under labeled
columns", add (pattern: that test):

```ts
test("the footer has a brand row and a bottom bar", async ({ page }) => {
  await open(page, "/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.locator(".site-footer__brand")).toHaveAttribute(
    "href",
    "/",
  );
  await expect(footer.getByText("Good work. Good company.")).toBeVisible();
  await expect(footer.getByText("Made to last.")).toBeVisible();
  await expect(
    footer.getByText(`© ${new Date().getFullYear()} El Camino Tattoos`),
  ).toBeVisible();
});
```

## Test plan

The new test; existing footer tests (address, labeled columns, CTA link); the
full a11y sweep (every route, light and dark, phone and desktop; the footer is
on all of them); the phone touch-target test (all new links are at least 44px).

## Done criteria

- [ ] Footer shows logo, tagline, (when set) Instagram, four proportioned columns, and a bottom bar with sign-off
- [ ] Instagram appears once in the footer (brand row), not also in "Get in touch"
- [ ] `/contact` still lists the Instagram handle as before
- [ ] No horizontal overflow at 375, 768, 1440
- [ ] `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm format:check`, `pnpm check:contrast`, `pnpm test` exit 0
- [ ] `plans/README.md` row 031 updated

## STOP conditions

- Plan 028 not merged.
- axe fails on the footer (`color-contrast`, `link-name`, `region`) in any sweep combination.
- Removing `.site-footer__name` / `.site-footer__copyright` breaks a test other than the footer ones named here.
- The `showInstagram` change alters the contact page output.

## Maintenance notes

- The mock's footer is a dark band in paper mode too; this project's light
  footer stays light. If the owner wants the inversion, it is a `roles.css`
  question (a footer-specific surface role), not a component change.
- The footer's Instagram link and `ShopContact` build the same URL; if a third
  place needs it, extract a helper next to `phoneHref` in `src/lib/site.ts`.
- Plans 030 and 031 both add `site` fields; keep the Keystatic admin field
  order meaningful (hero fields, then footer fields).
