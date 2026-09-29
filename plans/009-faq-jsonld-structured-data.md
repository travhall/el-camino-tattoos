# Plan 009: Add FAQPage structured data (JSON-LD) to `/faq`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 7e2834f..HEAD -- src/app/"(site)"/faq/page.tsx src/components/rich-text.tsx src/lib/content.ts tests/interactions.spec.ts`
> Compare the "Current state" excerpts against the live code; on any
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: feature (SEO)
- **Planned at**: commit `7e2834f`, 2026-09-29

## Why this matters

A competitor mock (an agent-generated tattoo-shop site, reviewed for ideas
worth porting) built its `/faq` page with `FAQPage` JSON-LD
(`https://schema.org/FAQPage`). That mock's version doesn't fit here as-is —
its FAQ content is a flat markdown string, so it stripped markdown syntax with
a regex; ours stores each answer as a Markdoc `Node` (rich text: bold, links,
lists), so a regex over raw text won't work. The underlying idea is sound and
carries no design risk: it's schema markup, invisible on the page, and can
make FAQ entries appear as expandable rich results in Google. It also has no
conflict with any open design or content decision — it's additive to a page
that already exists in production shape.

After this plan: `/faq` emits a `<script type="application/ld+json">`
containing one `Question`/`Answer` pair per rendered FAQ entry, with the
answer as clean plain text (markdown syntax and links resolved to their link
text, not stripped/mangled).

## Current state

`src/app/(site)/faq/page.tsx` (full file, 49 lines) renders `faqs` from
`getFaqs()` with no structured data:

```tsx
export default async function FaqPage() {
  const faqs = await getFaqs();

  return (
    <div className="stack">
      <h1>FAQ</h1>
      {faqs.length === 0 ? (
        <p className="muted measure">
          No questions have been added yet. If you have one, please{" "}
          <Link href="/contact" className="link">
            get in touch
          </Link>
          .
        </p>
      ) : (
        <div className="faq">
          {faqs.map((faq) => (
            <section
              key={faq.slug}
              id={faq.slug}
              aria-labelledby={`${faq.slug}-question`}
              className="faq__item"
            >
              <h2 id={`${faq.slug}-question`} className="heading-3">
                {faq.question}
              </h2>
              <RichText node={faq.answer} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
```

`src/lib/content.ts` (lines 109-114) defines:

```ts
export type Faq = {
  slug: string;
  question: string;
  order: number;
  answer: Node;
};
```

`answer` is a raw `@markdoc/markdoc` `Node` (the parsed AST before transform),
the same shape `getAftercare()` returns.

`src/components/rich-text.tsx` (full file, 17 lines) is the only place that
currently turns a Markdoc `Node` into anything else:

```tsx
import Markdoc, { type Node } from "@markdoc/markdoc";
import React from "react";

export function RichText({ node }: { node: Node }) {
  const tree = Markdoc.transform(node);
  return (
    <div className="richtext measure">
      {Markdoc.renderers.react(tree, React)}
    </div>
  );
}
```

`Markdoc.transform(node)` returns a `RenderableTreeNode` (recursively:
a string, or `{ name, attributes, children }` where `children` is an array of
more `RenderableTreeNode`s). There is no existing helper anywhere in the repo
that walks this to plain text — that's what this plan adds.

There is no existing `<script type="application/ld+json">` anywhere in the
codebase (`grep -rn "ld+json" src` currently returns nothing) and no CSP
nonce plumbing to account for.

The fixture FAQ entries (`scripts/fixtures.mjs`, `fixtures.faq`, used by
`pnpm test`) include one answer with a markdown link, useful for verifying
the plain-text extraction:

```
slug: "zz-fixture-deposit"
question: "How much is a deposit?"
answer: "A deposit holds your appointment. See the [contact page](/contact) to ask."
```

## Commands you will need

| Purpose   | Command                                               | Expected on success |
| --------- | ----------------------------------------------------- | ------------------- |
| Typecheck | `pnpm exec tsc --noEmit`                              | exit 0, no output   |
| Lint      | `pnpm lint`                                           | exit 0              |
| Format    | `pnpm format:check` (fix with `pnpm format`)          | exit 0              |
| Tests     | `pnpm test` (seeds fixtures, builds, runs Playwright) | all tests pass      |
| One test  | `pnpm test --grep "FAQPage"`                          | matching tests pass |

Use `pnpm` only.

## Scope

**In scope** (the only files you should modify):

- `src/components/rich-text.tsx` (add and export a plain-text helper)
- `src/app/(site)/faq/page.tsx` (build and render the JSON-LD script)
- `tests/interactions.spec.ts` or `tests/site.spec.ts` (add the test — pick
  whichever file's existing `describe` blocks better fit; `site.spec.ts`
  already tests `/faq`-adjacent content against real `content/site.yaml`,
  while fixture-dependent content tests live in `interactions.spec.ts` in
  this repo's convention — check both files' existing FAQ-independent tests
  before choosing)

**Out of scope** (do NOT touch):

- `src/lib/content.ts` — `getFaqs()` and the `Faq` type stay as is; no schema
  change needed.
- The FAQ page's visible markup, `.faq`/`.faq__item` styles, or category
  grouping — the mock's category/jump-nav UI is a separate, content-model
  decision (adding a `category` field to the FAQ collection) and is NOT part
  of this plan.
- `keystatic.config.ts`.
- Any other page's metadata or JSON-LD (there isn't any yet; don't add a
  site-wide `Organization`/`LocalBusiness` schema here — that needs real
  address/hours data, which is still a placeholder per
  `content/site.yaml`).

## Git workflow

- Branch: `advisor/009-faq-jsonld`
- One commit, e.g. `feat(faq): add FAQPage structured data`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add a plain-text extractor for Markdoc rich text

In `src/components/rich-text.tsx`, add and export a helper that walks a
transformed Markdoc tree to plain text, and import `RenderableTreeNode`:

```tsx
import Markdoc, { type Node, type RenderableTreeNode } from "@markdoc/markdoc";
import React from "react";

function collectText(node: RenderableTreeNode): string {
  if (typeof node === "string") return node;
  if (!node || typeof node !== "object" || !("children" in node)) return "";
  return (node.children ?? []).map(collectText).join(" ");
}

/** Flattens a Markdoc rich-text node to plain text (for JSON-LD, meta descriptions, etc). */
export function richTextToPlainText(node: Node): string {
  return collectText(Markdoc.transform(node)).replace(/\s+/g, " ").trim();
}
```

Leave `RichText` itself unchanged.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 2: Build and render the JSON-LD on the FAQ page

In `src/app/(site)/faq/page.tsx`:

1. Import `richTextToPlainText` from `@/components/rich-text` alongside the
   existing `RichText` import.
2. Inside `FaqPage`, after `const faqs = await getFaqs();` and before the
   `return`, build the schema (only when there are FAQs — an empty
   `mainEntity` array is not useful and the empty state already tells
   visitors to use `/contact`):

```tsx
const faqJsonLd =
  faqs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: richTextToPlainText(faq.answer),
          },
        })),
      }
    : null;
```

3. Render it right after the closing `</div>` of the existing `stack` div,
   still inside the component's returned fragment (wrap the existing
   `<div className="stack">...</div>` and this script in a fragment `<>...</>`
   if the component doesn't already return one — check the current return
   shape first):

```tsx
{
  faqJsonLd ? (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
    />
  ) : null;
}
```

**Verify**: `pnpm exec tsc --noEmit && pnpm lint` → both exit 0.

### Step 3: Add a test

Add a test (choose the file per the Scope note above), e.g.:

```ts
test("faq page emits valid FAQPage structured data", async ({ page }) => {
  await open(page, "/faq");
  const raw = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  const data = JSON.parse(raw ?? "");
  expect(data["@type"]).toBe("FAQPage");
  expect(data.mainEntity.length).toBeGreaterThan(0);
  const deposit = data.mainEntity.find(
    (q: { name: string }) => q.name === "How much is a deposit?",
  );
  expect(deposit.acceptedAnswer.text).toBe(
    "A deposit holds your appointment. See the contact page to ask.",
  );
  // markdown syntax must not leak into the plain-text answer
  expect(deposit.acceptedAnswer.text).not.toMatch(/[[\]()*_]/);
});
```

Adjust the `open`/`hydrated` helper import to match whichever spec file you
add this to (both `interactions.spec.ts` and `site.spec.ts` already define or
import an `open` helper — reuse it, don't duplicate it).

**Verify**: `pnpm test --grep "FAQPage"` → passes.

### Step 4: Full suite

**Verify** (all must exit 0): `pnpm lint`, `pnpm format:check`,
`pnpm exec tsc --noEmit`, `pnpm test`. `pnpm test` includes the axe sweep on
`/faq` in light and dark at two widths — a `<script>` tag with
`dangerouslySetInnerHTML` renders no visible content, but confirm it doesn't
trip axe (it shouldn't; it isn't rendered as visible DOM content axe scans
for violations on).

## Test plan

Covered in Step 3: JSON parses, `@type` is `FAQPage`, one `Question` per
rendered FAQ, and the deposit fixture's answer round-trips as clean plain
text with its markdown link resolved to link text and no leftover markdown
syntax characters. The existing axe sweep (`pnpm test`) covers `/faq`
regressions from the added script tag.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0 and `pnpm format:check` exits 0
- [ ] `pnpm test` exits 0, including the new structured-data test
- [ ] `grep -n "richTextToPlainText" src/components/rich-text.tsx src/app/"(site)"/faq/page.tsx` shows the helper defined and used
- [ ] Visiting `/faq` in `pnpm dev` and viewing source shows a single
      `<script type="application/ld+json">` with valid JSON
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts.
- `faq/page.tsx` does not already return a single root element/fragment in a
  way that cleanly accepts an added sibling `<script>` — report the actual
  shape rather than restructuring the component beyond what's described here.
- The plain-text extractor produces empty strings for a non-empty answer
  (a `Markdoc.transform` shape mismatch) — report the actual
  `RenderableTreeNode` shape you observed rather than guessing further.
- The axe sweep flags the new script tag.

## Maintenance notes

- `richTextToPlainText` is now a small reusable utility — reach for it again
  if a future page needs a plain-text version of Markdoc rich text (e.g. a
  meta `description`, an RSS feed, or other structured data).
- If FAQ entries ever gain a `category` field (see the mock's category/jump-nav
  idea, deliberately out of scope here — it needs a content-model decision
  from the site owner first), the JSON-LD in this plan doesn't need to change;
  `FAQPage` schema has no category concept.
- If a site-wide `LocalBusiness`/`Organization` JSON-LD is added later (once
  the real address/hours/phone replace the `content/site.yaml` placeholders),
  it belongs in `src/app/(site)/layout.tsx`, not here.
