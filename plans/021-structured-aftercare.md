# Plan 021: Replace free-form Aftercare rich text with structured steps + a warning section

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat f3511d3..HEAD -- keystatic.config.ts src/lib/content.ts "src/app/(site)/aftercare/page.tsx" scripts/fixtures.mjs tests/site.spec.ts CLAUDE.md`
> Compare the "Current state" excerpts against the live code before
> proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (content-model change to a singleton; no real content exists yet, so no migration risk, but touches 6 files)
- **Depends on**: none
- **Category**: direction (content-model change, owner-approved)
- **Planned at**: commit `f3511d3`, 2026-09-30

## Why this matters

The owner reviewed the structured Aftercare page in the design mock being
ported (numbered care steps, then a distinct "know when to get help"
warning) and asked to build the same shape here, accepting that it trades
some editor freedom for a page that reads better and is easier to scan —
explicitly open to Tyler having a different preference later, but not
expecting it to change much. Today's Aftercare page is a single free-form
Markdoc rich-text blob with no fixed shape at all (an editor could write
anything from a single paragraph to an unstructured wall of text).

This plan converts the `aftercare` singleton from one markdoc field to:
an `intro` line, an array of `steps` (title + body), and a `warning` field
that stays markdoc (so an editor can bold a symptom or link to a resource in
the one place that most needs it — the medical warning). The on-disk file
stays `content/aftercare.mdoc` (same path, same `.mdoc` extension — only
`steps`/`intro` move from free body text into YAML frontmatter alongside
it), so this isn't a file-location migration, just a shape change to a file
that doesn't have real content yet anyway (`content/aftercare.mdoc` isn't
committed in this repo today; only the test suite ever creates it,
temporarily, as a fixture).

## Current state

`keystatic.config.ts`, the `aftercare` singleton (lines 170–177 in full):

```ts
    aftercare: singleton({
      label: "Aftercare",
      path: "content/aftercare",
      format: { contentField: "content" },
      schema: {
        content: richText("Aftercare instructions", { headings: true }),
      },
    }),
```

`richText` (defined earlier in the same file, lines 23–45, unchanged by this
plan — reused for the new `warning` field, with `headings: false` since the
warning doesn't need its own sub-headings):

```ts
const richText = (label: string, { headings }: { headings: boolean }) =>
  fields.markdoc({
    label,
    extension: "mdoc",
    options: {
      bold: true,
      italic: true,
      link: true,
      orderedList: true,
      unorderedList: true,
      heading: headings ? [2, 3] : false,
      blockquote: false,
      code: false,
      codeBlock: false,
      divider: false,
      image: false,
      table: false,
      strikethrough: false,
    },
    ...
  });
```

The `site` singleton already has a working precedent for an array of
objects stored as YAML frontmatter — `hours` (unchanged by this plan,
quoted so you can mirror its exact shape for `steps`):

```ts
        hours: fields.array(
          fields.object({
            days: fields.text({
              label: "Days",
              ...
            }),
            time: fields.text({
              label: "Hours",
              ...
            }),
          }),
          {
            ...
            itemLabel: (props) =>
              `${props.fields.days.value} ${props.fields.time.value}`.trim(),
          },
        ),
```

`src/lib/content.ts`, the current `getAftercare()` (lines 29–34 in full,
plus the `hasContent` helper it shares with `getFaqs()`):

```ts
const hasContent = (node: Node) => node.children.length > 0;

/** The Aftercare page's rich text, or null until someone has written it. */
export const getAftercare = cache(async (): Promise<Node | null> => {
  const entry = await reader.singletons.aftercare.read();
  if (!entry) return null;
  const { node } = await entry.content();
  return hasContent(node) ? node : null;
});
```

`src/app/(site)/aftercare/page.tsx` (full file, 34 lines):

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { RichText } from "@/components/rich-text";
import { getAftercare } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { siteName } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Aftercare",
  description: `How to care for a new tattoo from ${siteName}.`,
  path: "/aftercare",
});

export default async function AftercarePage() {
  const content = await getAftercare();

  return (
    <div className="stack">
      <h1>Aftercare</h1>
      {content ? (
        <RichText node={content} />
      ) : (
        <p className="muted measure">
          Aftercare instructions haven&rsquo;t been added yet. If you have a
          question about a healing tattoo, please{" "}
          <Link href="/contact" className="link">
            get in touch
          </Link>
          .
        </p>
      )}
    </div>
  );
}
```

`scripts/fixtures.mjs` (relevant excerpts): the fixed-file comment (lines
65–68), the fixture text itself (lines 86–95), the write (lines 136–141,
`wx` flag so it never overwrites real content), and the cleanup (lines
205–213, byte-equality check):

```js
// FAQ entries are one file each (question and order in frontmatter, the answer
// as the body). Aftercare is a single fixed file, so it is only written when
// it doesn't exist and only removed while it still equals this text: real
// content is never touched.
```

```js
export const aftercareFixture = `## Fixture aftercare

Keep it clean and **do not** pick at it.

### The first days

1. Wash gently
2. Pat dry
3. Apply a thin layer of ointment
`;
```

```js
  // "wx" fails if the file exists, which is the point: never overwrite it.
  await writeFile(at("content/aftercare.mdoc"), aftercareFixture, {
    flag: "wx",
  }).catch((error) => {
    if (error.code !== "EEXIST") throw error;
  });
```

```js
  const aftercare = await readFile(at("content/aftercare.mdoc"), "utf8").catch(
    () => null,
  );
  if (aftercare === aftercareFixture) {
    await rm(at("content/aftercare.mdoc"), { force: true });
  }
```

(The exact line numbers of the write/cleanup blocks may have shifted
slightly from sibling plans landing — find them by searching for
`aftercareFixture` and `content/aftercare.mdoc` rather than trusting the
line numbers literally; the content quoted above is what must still match.)

`tests/site.spec.ts`, the current Aftercare test (lines 171–196 in full):

```ts
  test("Aftercare renders what the editor wrote, under one h1", async ({
    page,
  }) => {
    // The fixture only exists when there was no real Aftercare file to keep.
    const file = path.join(process.cwd(), "content/aftercare.mdoc");
    const seeded =
      existsSync(file) &&
      readFileSync(file, "utf8").includes("Fixture aftercare");
    test.skip(!seeded, "real Aftercare content is present");

    await open(page, "/aftercare");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Aftercare",
    );
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(
      "Fixture aftercare",
    );
    await expect(page.getByRole("heading", { level: 3 })).toHaveText(
      "The first days",
    );
    await expect(page.locator("main ol > li")).toHaveText([
      "Wash gently",
      "Pat dry",
      "Apply a thin layer of ointment",
    ]);
  });
});
```

`CLAUDE.md` (line 42) currently documents the old shape:

> **Editable pages:** Aftercare (`content/aftercare.mdoc`) and FAQ
> (`content/faq/*.mdoc`) are Keystatic Markdoc rich text (`richText` in
> `keystatic.config.ts` limits what an editor can make), read with
> `getAftercare()` and `getFaqs()` and rendered by `RichText` (`.richtext`
> in typography.css). Each page supplies its own h1, so editor headings
> start at h2. Empty pages show a message pointing to `/contact`.

Confirmed role/Tailwind mappings this plan uses (`grep -n "color-warning" src/styles/theme.css`):
`--color-warning`, `--color-warning-text`, `--color-warning-soft` — all
already mapped, no new role needed. `warning`'s documented job (per
`roles.css`'s header comment) is "waitlist, heads-up" — a medical "know when
to get help" notice is exactly a heads-up, not an error.

## Commands you will need

| Purpose   | Command                                      | Expected on success |
| --------- | ---------------------------------------------| -------------------- |
| Typecheck | `pnpm exec tsc --noEmit`                     | exit 0, no output    |
| Lint      | `pnpm lint`                                   | exit 0                |
| Format    | `pnpm format:check` (fix with `pnpm format`)  | exit 0                |
| Tests     | `pnpm test` (seeds fixtures, builds, runs Playwright) | all pass |
| One test  | `pnpm test --grep "Aftercare"`                | matching tests pass  |

Use `pnpm` only.

## Scope

**In scope** (the only files you should modify):

- `keystatic.config.ts` (the `aftercare` singleton only)
- `src/lib/content.ts` (`getAftercare()` and its new return type only — do not touch `getFaqs()`, `hasContent`, or any other export)
- `src/app/(site)/aftercare/page.tsx`
- `scripts/fixtures.mjs` (the aftercare fixture text, write, and cleanup — not the FAQ or artist fixtures)
- `tests/site.spec.ts` (the one Aftercare test)
- `CLAUDE.md` (the one sentence quoted above, to stop documenting a shape that no longer exists)

**Out of scope** (do NOT touch):

- `src/components/rich-text.tsx` — reused as-is for the `warning` field.
- The `faq` collection, `getFaqs()`, or `/faq` — a separate content type, not touched by this plan.
- Any print button, decorative flash-art motif, or sidebar layout from the reviewed mock — this codebase has no icon system and no sidebar/aside pattern anywhere else; this plan keeps the existing single-column `.stack` layout convention. A print button is a reasonable future nicety, not part of this plan.
- `src/styles/roles.css` — the `warning` role already exists and is used as-is; no role changes.

## Git workflow

- Branch: `advisor/021-structured-aftercare`
- Commit per logical unit, e.g. `feat(aftercare): restructure the schema into steps and a warning field`, `feat(aftercare): render the structured steps and warning`, `test(aftercare): cover the structured content`, `docs(claude): update the Aftercare shape description`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Restructure the Keystatic schema

Replace the `aftercare` singleton (lines 170–177) with:

```ts
    aftercare: singleton({
      label: "Aftercare",
      path: "content/aftercare",
      format: { contentField: "warning" },
      schema: {
        intro: fields.text({
          label: "Intro",
          description: "One short line under the page heading.",
        }),
        steps: fields.array(
          fields.object({
            title: fields.text({ label: "Title" }),
            body: fields.text({ label: "Body", multiline: true }),
          }),
          {
            label: "Care steps",
            description: "Shown in order, numbered automatically on the page.",
            itemLabel: (props) => props.fields.title.value || "Step",
          },
        ),
        warning: richText("When to get help", { headings: false }),
      },
    }),
```

This mirrors the `site` singleton's existing `hours` field exactly (array
of a two-field object, `itemLabel` from one of the fields) — do not invent a
different shape.

**Verify**: `grep -n "steps: fields.array\|warning: richText" keystatic.config.ts` shows both.

### Step 2: Rewrite `getAftercare()`

Replace the current `getAftercare()` (keep the existing `hasContent` helper
exactly as is — both `getFaqs()` and this function still use it) with:

```ts
export type AftercareStep = { title: string; body: string };

export type Aftercare = {
  intro: string;
  steps: readonly AftercareStep[];
  warning: Node;
} | null;

/** The Aftercare page's structured content, or null until someone has written it. */
export const getAftercare = cache(async (): Promise<Aftercare> => {
  const entry = await reader.singletons.aftercare.read();
  if (!entry) return null;
  const { node } = await entry.warning();
  const steps = entry.steps.filter((step) => step.title && step.body);
  const hasIntro = Boolean(entry.intro);
  const hasWarning = hasContent(node);
  if (!hasIntro && steps.length === 0 && !hasWarning) return null;
  return { intro: entry.intro ?? "", steps, warning: node };
});
```

Steps missing a `title` or `body` are filtered out rather than rendered
half-empty — an editor mid-edit on a new step shouldn't publish a blank
list item.

**Verify**: `pnpm exec tsc --noEmit` → exit 0. If `entry.steps`/`entry.warning` don't typecheck, re-check Step 1's field names for a typo before assuming anything else is wrong.

### Step 3: Rewrite the Aftercare page

Replace `src/app/(site)/aftercare/page.tsx` in full:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { RichText } from "@/components/rich-text";
import { getAftercare } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { siteName } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Aftercare",
  description: `How to care for a new tattoo from ${siteName}.`,
  path: "/aftercare",
});

export default async function AftercarePage() {
  const content = await getAftercare();

  return (
    <div className="stack stack--lg">
      <div className="stack">
        <h1>Aftercare</h1>
        {content?.intro ? (
          <p className="lead measure">{content.intro}</p>
        ) : null}
      </div>

      {content ? (
        <>
          {content.steps.length > 0 && (
            <ol className="aftercare-steps">
              {content.steps.map((step, index) => (
                <li key={step.title} className="aftercare-step">
                  <span aria-hidden="true" className="aftercare-step__number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="stack stack--sm">
                    <h2 className="heading-3">{step.title}</h2>
                    <p className="measure">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div className="aftercare-warning">
            <h2 className="heading-3">When to get help</h2>
            <RichText node={content.warning} />
          </div>
        </>
      ) : (
        <p className="muted measure">
          Aftercare instructions haven&rsquo;t been added yet. If you have a
          question about a healing tattoo, please{" "}
          <Link href="/contact" className="link">
            get in touch
          </Link>
          .
        </p>
      )}
    </div>
  );
}
```

The warning section renders whenever `content` is non-null — even if the
owner never fills in `steps`, a warning-only Aftercare page is more useful
than none; `getAftercare()`'s own emptiness check (Step 2) already handles
the fully-empty case by returning `null`, which still shows the "haven't
been added yet" message. Heading order: page `h1`, then one `h2` per step
(siblings — this already matches how `/faq` renders many sibling `h2`s, one
per question), then a final `h2` for "When to get help." No skipped levels.

**Verify**: `pnpm exec tsc --noEmit && pnpm lint` → both exit 0.

### Step 4: Add the CSS

Append to `src/styles/components.css`, inside `@layer components { ... }`
(after the FAQ rules, before `.status-page`, or anywhere else inside the
layer — exact position doesn't matter, just keep it inside the layer):

```css
  /* Aftercare: numbered care steps, then a distinct warning callout. */
  .aftercare-steps {
    @apply grid list-none gap-fluid-md;
  }

  .aftercare-step {
    @apply grid grid-cols-[auto_1fr] items-start gap-fluid-sm;
  }

  .aftercare-step__number {
    @apply font-display text-2xl text-muted;
  }

  /* `warning` role: "waitlist, heads-up" per roles.css — a medical notice to
     pay attention to, not an error. */
  .aftercare-warning {
    @apply border-l-2 border-warning bg-warning-soft p-fluid-sm;
  }
```

**Verify**: `grep -n "aftercare-steps\|aftercare-step\b\|aftercare-step__number\|aftercare-warning" src/styles/components.css` shows all four class names.

### Step 5: Update the fixture

Replace the fixture text and the comment above it (currently lines 65–68
and 86–95 — search for `aftercareFixture` to find the live location):

```js
// FAQ entries are one file each (question and order in frontmatter, the answer
// as the body). Aftercare is a single fixed file (YAML frontmatter for intro/
// steps, a markdoc body for the warning), so it is only written when it
// doesn't exist and only removed while it still equals this text: real
// content is never touched.
```

```js
export const aftercareFixture = `---
intro: Fixture aftercare intro line.
steps:
  - title: Keep it clean
    body: Wash gently and pat dry with a clean towel.
  - title: Apply a thin layer
    body: Use the aftercare product your artist recommended.
---

Call a doctor if you see **increasing redness** or a fever.
`;
```

The write (`flag: "wx"`) and cleanup (byte-equality against
`aftercareFixture`) logic that reference this constant do not need to
change — they treat the fixture as an opaque string, which still works
once the string itself has the new shape. Confirm this yourself by reading
both blocks before assuming so.

**Verify**: `node scripts/fixtures.mjs seed && cat content/aftercare.mdoc && node scripts/fixtures.mjs clean` shows the new YAML-frontmatter-plus-body shape, then cleans up (confirm `git status` is clean after).

### Step 6: Update the test

Replace the Aftercare test in `tests/site.spec.ts` (search for
`"Aftercare renders what the editor wrote"`) with:

```ts
  test("Aftercare renders structured steps and a warning, under one h1", async ({
    page,
  }) => {
    // The fixture only exists when there was no real Aftercare file to keep.
    const file = path.join(process.cwd(), "content/aftercare.mdoc");
    const seeded =
      existsSync(file) &&
      readFileSync(file, "utf8").includes("Fixture aftercare intro line");
    test.skip(!seeded, "real Aftercare content is present");

    await open(page, "/aftercare");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Aftercare",
    );
    await expect(page.getByText("Fixture aftercare intro line")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Keep it clean" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Apply a thin layer" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "When to get help" }),
    ).toBeVisible();
    await expect(page.getByText("increasing redness")).toBeVisible();
  });
});
```

**Verify**: `pnpm test --grep "Aftercare renders structured"` → passes.

### Step 7: Update CLAUDE.md

Replace the sentence quoted in "Current state" (line 42) with:

```markdown
- **Editable pages:** FAQ (`content/faq/*.mdoc`) is Keystatic Markdoc rich text (`richText` in `keystatic.config.ts` limits what an editor can make), read with `getFaqs()` and rendered by `RichText` (`.richtext` in typography.css). Aftercare (`content/aftercare.mdoc`) is structured instead: an `intro` line and an array of `steps` (title + body) as YAML frontmatter, plus a `warning` markdoc field as the file body, read with `getAftercare()` — only the warning uses `RichText`; the intro and steps render as plain text. Each page supplies its own h1. Empty pages show a message pointing to `/contact`.
```

**Verify**: `grep -n "Aftercare" CLAUDE.md` shows the updated sentence.

### Step 8: Full verification

Run, in order: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm format:check`
(fix with `pnpm format` if needed), `pnpm test`.

`pnpm test` includes the axe sweep on `/aftercare` in both themes at both
widths — the new `warning` role styling and the numbered-step layout are
both worth axe's scrutiny; a `border-warning`/`bg-warning-soft` pairing has
not been used in a component before (it's a new role *combination*, not a
new role), so double-check the contrast numbers in `/styleguide` if axe
flags anything, rather than assuming the role is safe in every combination.

**Verify**: all four commands exit 0.

## Test plan

Covered in Step 6: the structured steps and warning render correctly from
the new fixture shape, under one `h1`, with each step and the warning
getting their own heading. The existing axe sweep (every route, both
themes, both widths) is the regression guard for the new `.aftercare-*`
markup and the `warning` role combination used for the first time.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0 and `pnpm format:check` exits 0
- [ ] `pnpm test` exits 0, including the rewritten Aftercare test
- [ ] `grep -n "steps: fields.array\|warning: richText" keystatic.config.ts` shows both
- [ ] `grep -n "AftercareStep\|export type Aftercare" src/lib/content.ts` shows the new type
- [ ] Visiting `/aftercare` in `pnpm dev` (after `node scripts/fixtures.mjs seed`) shows numbered steps and a distinct "When to get help" warning callout, in both themes
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any excerpt in "Current state" doesn't match the live code.
- `entry.steps` or `entry.warning` fail to typecheck in a way that isn't a simple naming mismatch against Step 1's schema.
- The axe sweep flags the `warning`/`warning-soft` pairing used in `.aftercare-warning` — report the exact contrast numbers from `/styleguide` rather than swapping to a different role.
- The fixture write/cleanup logic in `scripts/fixtures.mjs` needs more than a text-constant change to keep working with the new shape — report what you found rather than restructuring that logic yourself.

## Maintenance notes

- A print button (`onClick={() => window.print()}`) was in the reviewed
  mock's Aftercare sidebar and is a reasonable follow-up, but needs a small
  client component (this page is currently a server component) — out of
  scope here, not forgotten.
- If the owner wants `intro` to support more than one short line later,
  that's a one-field change (`fields.text` → `multiline: true`, or a second
  `fields.text` field) plus a render-side split on newlines — not a reason
  to over-build multi-paragraph support now with zero current need.
- `steps` and `warning` are independent — an editor can fill in steps with
  no warning text (warning section just won't render, since
  `getAftercare()` still returns a non-null object as long as *something*
  is filled in) or vice versa. This is intentional flexibility within an
  otherwise fixed shape.
