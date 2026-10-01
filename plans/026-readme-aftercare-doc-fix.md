# Plan 026: Fix README's stale description of the Aftercare page

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 23ebb10..HEAD -- README.md keystatic.config.ts`
> If `README.md`'s "Content" section or the Aftercare schema in
> `keystatic.config.ts` has changed since this plan was written, re-read both
> before proceeding — the exact wording below may need adjusting to match.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `23ebb10`, 2026-09-30

## Why this matters

`README.md`'s "Content" section still describes the Aftercare page as "one
rich-text entry" where "the editor offers bold, italic, links, lists and
(Aftercare only) headings." That was true before plan 021 (already merged
to main) restructured Aftercare into a different shape: an `intro` line
plus an array of numbered `steps` (title + body, plain text, as YAML
frontmatter) and a `warning` rich-text field (the markdoc body). `CLAUDE.md`
was corrected as part of plan 021's own scope, but `README.md` — a
different file, outside that plan's listed scope — was not, and nobody has
touched it since.

Wrong setup docs are worse than missing ones: anyone onboarding to this
repo, or an editor using the admin at `/keystatic`, gets told the Aftercare
page supports headings and is one free-form block, when it's actually a
structured intro/steps/warning form. This is a pure documentation fix — no
code changes.

## Current state

`README.md`, line 67 (inside the "## Content" section):

```markdown
The **Aftercare** page and the **FAQ** are also edited in the admin, under **Pages**. Aftercare is one rich-text entry (`content/aftercare.mdoc`), and each FAQ question is its own entry (`content/faq/*.mdoc`) with an order number. The editor offers bold, italic, links, lists and (Aftercare only) headings, so the page layout can't be broken. Until something is written, each page says so and points to the contact form. Each question is linkable by its slug, e.g. `/faq#deposit`.
```

The already-corrected equivalent sentence in `CLAUDE.md` (line 42, for
reference — do not change `CLAUDE.md`, it's already accurate, just use its
wording as your model for the fix):

```markdown
- **Editable pages:** FAQ (`content/faq/*.mdoc`) is Keystatic Markdoc rich text (`richText` in `keystatic.config.ts` limits what an editor can make), read with `getFaqs()` and rendered by `RichText` (`.richtext` in typography.css). Aftercare (`content/aftercare.mdoc`) is structured instead: an `intro` line and an array of `steps` (title + body) as YAML frontmatter, plus a `warning` markdoc field as the file body, read with `getAftercare()` — only the warning uses `RichText`; the intro and steps render as plain text. Each page supplies its own h1. Empty pages show a message pointing to `/contact`.
```

The actual schema this describes, `keystatic.config.ts` lines 170-192
(the `aftercare` singleton — read-only reference, do not change this file):

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

## Commands you will need

| Purpose      | Command             | Expected on success |
| ------------ | ------------------- | ------------------- |
| Format check | `pnpm format:check` | exit 0              |

No build, typecheck, or test command is relevant — this change touches only
a markdown documentation file with no code behind it.

## Scope

**In scope:**

- `README.md` — rewrite the one sentence in the "Content" section that
  describes Aftercare (line 67, quoted above).

**Out of scope — do not touch:**

- `CLAUDE.md` — already correct, already matches this plan's model wording.
- `keystatic.config.ts`, `src/lib/content.ts`,
  `src/app/(site)/aftercare/page.tsx` — the actual Aftercare implementation
  is correct and already shipped (plan 021). This plan only fixes a stale
  description of it.
- Any other part of `README.md` — do not "clean up while you're in there."
  Confirm the rest of the file still reads correctly after your edit, but
  don't rewrite surrounding sentences unless this plan's own done criteria
  require it.

## Git workflow

Work in your isolated worktree. One commit for this change. Message style:
conventional commits, matching this repo's history, e.g.
`docs(readme): fix the stale Aftercare description`. Do not merge, push, or
touch any branch besides your own worktree's.

## Steps

### Step 1 — Rewrite the stale sentence

In `README.md`, replace the sentence that currently reads:

```markdown
Aftercare is one rich-text entry (`content/aftercare.mdoc`), and each FAQ question is its own entry (`content/faq/*.mdoc`) with an order number. The editor offers bold, italic, links, lists and (Aftercare only) headings, so the page layout can't be broken.
```

(this is the middle portion of the paragraph that starts "The **Aftercare**
page and the **FAQ** are also edited in the admin...", on line 67) with:

```markdown
The FAQ is Markdoc rich text — each question is its own entry (`content/faq/*.mdoc`) with an order number, and the editor offers bold, italic, links and lists, so the page layout can't be broken. Aftercare (`content/aftercare.mdoc`) is structured instead: an intro line, a numbered list of care steps (title + body, plain text), and a "when to get help" field that's rich text (bold, italic, links, lists).
```

Keep the rest of the paragraph (the sentences before and after this one —
"The **Aftercare** page and the **FAQ** are also edited..." at the start,
and "Until something is written, each page says so..." at the end)
unchanged. Read the full paragraph after your edit to confirm it still
reads as one coherent paragraph, not two disconnected halves.

**Verify:**

```bash
pnpm format:check
```

Expect exit 0 (Prettier formats markdown too — if this fails, run
`pnpm format` and confirm it only touched `README.md`).

### Step 2 — Confirm the fix matches the real schema

```bash
grep -n "intro\|steps\|warning" keystatic.config.ts | grep -A0 "fields\."
```

Read the output against your new README sentence: it should mention
`intro` (a short text field), `steps` (an array of title+body), and
`warning` (the one rich-text field) — matching what you just wrote. This
is a manual read-and-compare, not a command with a pass/fail exit code.

## Test plan

None — this is a documentation-only change with no executable behavior to
test. The verification is Step 1's format check and Step 2's manual
comparison against the live schema.

## Done criteria

- [ ] `README.md` no longer says Aftercare is "one rich-text entry" with
      "(Aftercare only) headings"
- [ ] `README.md` describes Aftercare's real shape: intro line, numbered
      steps (title + body), and a rich-text "when to get help" field
- [ ] `pnpm format:check` exits 0
- [ ] No files outside `README.md` modified
- [ ] `plans/README.md` status row updated for plan 026

## STOP conditions

- If `keystatic.config.ts`'s `aftercare` schema has changed since this plan
  was written (drift check above) — e.g. a field renamed or added — rewrite
  the README sentence to match the _current_ schema, not the one quoted in
  this plan, and note the discrepancy in your report.
- If `README.md`'s "Content" section has been restructured (different
  paragraph breaks, moved content) such that the quoted sentence doesn't
  appear as shown, STOP and report rather than guessing where the
  equivalent text now lives.

## Maintenance notes

- This is exactly the kind of drift that caused the original finding:
  `CLAUDE.md` and `README.md` both describe the same content model, and
  plan 021 updated one but not the other because its own scope only listed
  `CLAUDE.md`. Future plans that change the Keystatic schema should check
  both files, not just `CLAUDE.md`.
