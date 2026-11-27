import type { Metadata } from "next";
import { Filmstrip } from "@/components/filmstrip";
import { Hero } from "@/components/hero";
import {
  getArtists,
  getFilmstripPieces,
  type HeroContent,
} from "@/lib/content";
import { ShopPromises } from "@/components/shop-promises";
import {
  Button,
  ButtonLink,
  IconButton,
  IconButtonLink,
} from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { RadioTabs } from "@/components/ui/radio-tabs";
import palette from "@/styles/palette.generated.json";
import typeScale from "@/styles/type-scale.generated.json";
import {
  checkContrast,
  loadInputs,
  passes,
} from "../../../../scripts/contrast.mjs";

export const metadata: Metadata = {
  title: "Style guide",
  robots: { index: false, follow: false },
};

// Hero variants as in the design (Figma Ideation page), with fixed copy so
// the styleguide doesn't change when the pages' heroes are edited.
const heroCopy = {
  eyebrow: "Tradition at heart. All are welcome.",
  heading: "Classic Tattoos, Fair Prices",
  intro:
    "Three artists in downtown Eau Claire making bold, clean work that lasts, at prices that make sense for everyday people.",
  buttons: [
    { label: "Free consultation", href: "/contact" },
    { label: "See our work", href: "/portfolio" },
  ],
};
const heroPhoto = {
  src: "/demo/Home Image.jpg",
  alt: "A tattoo artist at a workstation, with flash and framed prints on the wall.",
};
const heroDemos: {
  label: string;
  size: "home" | "page";
  hero: HeroContent;
}[] = [
  { label: "Home", size: "home", hero: { ...heroCopy, image: null } },
  {
    label: "Page, photo left",
    size: "page",
    hero: { ...heroCopy, image: { ...heroPhoto, position: "left" } },
  },
  {
    label: "Page, photo right",
    size: "page",
    hero: { ...heroCopy, image: { ...heroPhoto, position: "right" } },
  },
];

const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900];

// Grouped the way roles.css's own header comment groups them, so a
// maintainer scans one theme (surfaces, text, accent, status, ...) instead
// of all 49 in declaration order.
const roleGroups = [
  {
    title: "Surfaces",
    roles: [
      { name: "background", note: "page canvas" },
      { name: "surface", note: "cards, inputs, placeholders" },
      { name: "surface-raised", note: "nav pill, menus" },
      { name: "surface-sunken", note: "section bands, footer" },
    ],
  },
  {
    title: "Text",
    roles: [
      { name: "foreground", note: "text, solid ink fills" },
      { name: "muted", note: "secondary text" },
      { name: "subtle", note: "third-tier text, photo labels" },
    ],
  },
  {
    title: "Overlays",
    roles: [
      { name: "scrim", note: "fill behind text on photos" },
      { name: "veil", note: "dims the page behind dialogs" },
    ],
  },
  {
    title: "Borders & focus",
    roles: [
      { name: "outline", note: "interactive borders" },
      { name: "border", note: "container edges" },
      { name: "line", note: "dividers" },
      { name: "hover", note: "hover fill" },
      { name: "focus", note: "focus ring" },
    ],
  },
  {
    title: "Accent",
    roles: [
      { name: "accent", note: "gold fills: badges, details" },
      { name: "on-accent", note: "text on a brass fill" },
      { name: "accent-hover", note: "accent fill, hovered" },
      { name: "accent-text", note: "gold as readable text" },
      { name: "accent-soft", note: "tinted backgrounds" },
      { name: "accent-mark", note: "gold marks: underlines, states, edges" },
    ],
  },
  {
    title: "Status",
    roles: [
      { name: "error", note: "invalid borders, alert edges" },
      { name: "error-text", note: "error messages" },
      { name: "error-soft", note: "alert background" },
      { name: "success", note: "open, success marks" },
      { name: "success-text", note: "success messages" },
      { name: "success-soft", note: "success tint" },
      { name: "warning", note: "waitlist, warning marks" },
      { name: "warning-text", note: "warning messages" },
      { name: "warning-soft", note: "warning tint" },
    ],
  },
  {
    title: "UI tokens",
    roles: [
      { name: "button-primary-bg", note: "UI: primary button fill" },
      { name: "button-primary-fg", note: "UI: primary button label" },
      { name: "button-primary-hover", note: "UI: primary button, hovered" },
      { name: "button-primary-border", note: "UI: primary button edge" },
      { name: "button-secondary-border", note: "UI: secondary button edge" },
      { name: "button-secondary-fg", note: "UI: secondary button label" },
      {
        name: "button-secondary-hover",
        note: "UI: secondary button, hovered",
      },
      { name: "link-text", note: "UI: link text" },
      { name: "link-underline", note: "UI: link underline" },
      { name: "nav-current", note: "UI: current nav indicator" },
      { name: "chip-border", note: "UI: filter chip edge" },
      { name: "chip-hover", note: "UI: filter chip, hovered" },
      { name: "chip-selected-bg", note: "UI: selected chip fill" },
      { name: "chip-selected-fg", note: "UI: selected chip label" },
      { name: "chip-selected-border", note: "UI: selected chip edge" },
      { name: "chip-selected-mark", note: "UI: selected chip dot" },
      { name: "tab-current", note: "UI: chosen tab underline" },
      { name: "selection-bg", note: "UI: selected text fill" },
      { name: "selection-fg", note: "UI: selected text" },
      { name: "focus-ring", note: "UI: keyboard focus outline" },
      { name: "status-open", note: "UI: open, books open" },
      { name: "status-waitlist", note: "UI: waitlist" },
      { name: "status-closed", note: "UI: closed" },
    ],
  },
] as const;

// Mirrors each <Section id="..." title="..."> below, for the jump nav.
const sectionNav = [
  { id: "typography", title: "Typography" },
  { id: "spacing", title: "Spacing" },
  { id: "color", title: "Color" },
  { id: "buttons", title: "Buttons" },
  { id: "forms", title: "Form fields" },
  { id: "tabs", title: "Tabs" },
  { id: "chips", title: "Choice chips" },
  { id: "filters", title: "Filter chips" },
  { id: "cards", title: "Cards and grid" },
  { id: "filmstrip", title: "Filmstrip" },
  { id: "hero", title: "Hero" },
] as const;

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="sg-section">
      <h2 id={`${id}-heading`}>{title}</h2>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="small muted measure">{children}</p>;
}

type Pairing = ReturnType<typeof checkContrast>[number];

// Never color alone: a miss is spelled out in the cell.
function ratio(row: Pairing) {
  const value = row.ratio;
  if (value === null) return "role missing";
  return passes(row) ? `${value}:1` : `${value}:1, below minimum`;
}

export default async function StyleGuidePage() {
  const { config, steps, space } = typeScale;
  const { rolesCss, ramps } = await loadInputs();
  const pairs = checkContrast(rolesCss, ramps);
  const [artists, filmstrip] = await Promise.all([
    getArtists(),
    getFilmstripPieces(),
  ]);

  return (
    <div className="stack stack--xl">
      <header className="stack">
        <h1 className="display">Style guide</h1>
        <p className="lead muted measure">
          A working reference for type, color and UI. Placeholder styles until
          the brand is settled. Not indexed.
        </p>
      </header>

      <nav className="sg-toc" aria-label="Style guide sections">
        <ul className="sg-toc__list">
          {sectionNav.map(({ id, title }) => (
            <li key={id}>
              <a href={`#${id}`}>{title}</a>
            </li>
          ))}
        </ul>
      </nav>

      <Section id="typography" title="Typography">
        <div className="sg-split">
          <div className="stack stack--sm">
            <Label>Display: Being (headings)</Label>
            <p className="display">El Camino Tattoos</p>
          </div>
          <div className="stack stack--sm">
            <Label>Body: Hanken Grotesk</Label>
            <p className="display sg-face-body">El Camino Tattoos</p>
          </div>
        </div>

        <div className="stack">
          <Label>
            Fluid scale: {config.minBase}px at {config.minViewport}px, ratio{" "}
            {config.minRatio} &rarr; {config.maxBase}px at {config.maxViewport}
            px, ratio {config.maxRatio}. Steps below base hold a fixed{" "}
            {config.smallRatio} ratio. Resize the window to watch it move.
            Generated by <code>pnpm type-scale</code>.
          </Label>
          {steps.map((step) => (
            <div key={step.name} className="sg-scale-row">
              <span className="small muted">
                text-{step.name} &middot; {step.minPx.toFixed(1)} &rarr;{" "}
                {step.maxPx.toFixed(1)}px
              </span>
              <span
                className="sg-face-display"
                style={{
                  fontSize: `var(--text-${step.name})`,
                  lineHeight: `var(--text-${step.name}--line-height)`,
                  letterSpacing: step.tracking ?? undefined,
                }}
              >
                Custom work, walk-ins, flash
              </span>
            </div>
          ))}
        </div>

        <div className="stack">
          <Label>Semantic classes</Label>
          <p className="display">.display</p>
          <h1>h1 / .heading-1</h1>
          <h2>h2 / .heading-2</h2>
          <h3>h3 / .heading-3</h3>
          <h4>h4 / .heading-4</h4>
          <p className="lead">.lead: introductory copy that sets up a page.</p>
          <p>Body: the default paragraph style.</p>
          <p className="small">.small: secondary detail.</p>
          <p className="caption">.caption: metadata and captions.</p>
          <p className="eyebrow">.eyebrow</p>
        </div>

        <div className="sg-split">
          <div className="stack stack--sm">
            <Label>Being weights (variable, 100 to 900)</Label>
            {weights.map((weight) => (
              <p
                key={weight}
                className="heading-3"
                style={{ fontWeight: weight }}
              >
                {weight} Fine line, blackwork, traditional
              </p>
            ))}
          </div>
          <div className="stack stack--sm">
            <Label>Hanken Grotesk weights (variable, 100 to 900)</Label>
            {weights.map((weight) => (
              <p
                key={weight}
                className="heading-3 sg-face-body"
                style={{ fontWeight: weight }}
              >
                {weight} Fine line, blackwork, traditional
              </p>
            ))}
          </div>
        </div>

        <div className="stack measure">
          <Label>Body copy</Label>
          <p>
            Keep new tattoos clean and moisturized. Wash gently with
            fragrance-free soap, pat dry, and apply a thin layer of ointment.
            Avoid soaking, direct sun and picking at scabs while it heals.
          </p>
          <p className="small muted">
            Secondary text, captions and metadata use the muted color.
          </p>
          <p>
            A{" "}
            <a href="#typography" className="link">
              text link
            </a>{" "}
            sits inline with body copy.
          </p>
        </div>
      </Section>

      <Section id="spacing" title="Spacing">
        <div className="stack">
          <Label>
            Fluid space scale: multiples of the base size, so space and type
            scale together. Use these through Tailwind, e.g.{" "}
            <code>gap-fluid-md</code>, <code>p-fluid-lg</code>,{" "}
            <code>py-fluid-xl</code>. Generated by <code>pnpm type-scale</code>.
          </Label>
          {space.map((step) => (
            <div key={step.name} className="sg-scale-row">
              <span className="small muted">
                {step.name} &middot; {step.minPx.toFixed(1)} &rarr;{" "}
                {step.maxPx.toFixed(1)}px
              </span>
              <span
                className="sg-space-bar"
                style={{ inlineSize: `var(--spacing-fluid-${step.name})` }}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section id="color" title="Color">
        <div className="stack">
          <Label>
            Roles, live in the current light or dark theme. Components use
            roles, never ramp steps directly.
          </Label>
          {roleGroups.map((group) => (
            <div key={group.title} className="stack stack--sm">
              <h3>{group.title}</h3>
              <ul className="sg-swatches">
                {group.roles.map(({ name, note }) => (
                  <li key={name} className="stack stack--sm">
                    <div
                      className="sg-swatch"
                      style={{ backgroundColor: `var(--${name})` }}
                    />
                    <p className="small">{name}</p>
                    <p className="caption">{note}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="stack stack--sm">
          <h3>scrim, in context</h3>
          <Label>
            A flat swatch can&rsquo;t show what scrim is for: opacity applied
            where it&rsquo;s used, over a photo, so text on top stays readable.
            This is <code>bg-scrim/60</code> over a placeholder image with{" "}
            <code>text-foreground</code> on top.
          </Label>
          <div className="sg-scrim-demo">
            <p className="sg-scrim-demo__caption">
              Fine line &middot; Traditional
            </p>
          </div>
        </div>

        <div className="stack">
          <Label>
            Primitive ramps: brand colors pinned to steps, the rest generated in
            OKLCH. Ships as a single oklch() declaration, no hex (see
            package.json&rsquo;s browserslist) &mdash; edit the pinned values in
            scripts/color-ramps.mjs, then run <code>pnpm color-ramps</code>.
            Roles are hand-edited in <code>src/styles/roles.css</code>, no build
            step.
          </Label>
          {Object.entries(ramps as Record<string, Record<string, string>>).map(
            ([name, ramp]) => (
              <div key={name} className="stack stack--sm">
                <p className="small">{name}</p>
                <ul className="sg-ramp">
                  {Object.entries(ramp).map(([step, hex]) => (
                    <li key={step}>
                      <div
                        className="sg-swatch"
                        style={{ backgroundColor: `var(--${name}-${step})` }}
                      />
                      <p className="caption">{step}</p>
                      <p className="caption">{hex}</p>
                      <p className="caption">
                        {
                          (
                            palette.oklch as Record<
                              string,
                              Record<string, string>
                            >
                          )[name]?.[step]
                        }
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>

        <table className="sg-table">
          <caption>
            Contrast, measured from roles.css. This only reports; run{" "}
            <code>pnpm check:contrast</code> to fail on a miss (CI does).
          </caption>
          <thead>
            <tr>
              <th scope="col">Pairing</th>
              <th scope="col">Used for</th>
              <th scope="col">Min</th>
              <th scope="col">Ratio</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair) => (
              <tr key={`${pair.fg}-${pair.bg}`}>
                <th scope="row">
                  {pair.fg} on {pair.bg}
                </th>
                <td>{pair.note}</td>
                <td>{pair.min}:1</td>
                <td>{ratio(pair)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section id="buttons" title="Buttons">
        <div className="cluster">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="cluster">
          <Button disabled>Primary disabled</Button>
          <Button variant="secondary" disabled>
            Secondary disabled
          </Button>
          <Button variant="ghost" disabled>
            Ghost disabled
          </Button>
          <Button variant="link" disabled>
            Link disabled
          </Button>
          <Button pending>Pending</Button>
        </div>
        <div className="cluster">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
        <div className="cluster">
          <Button icon="arrow-right">Request an appointment</Button>
          <Button variant="secondary" icon="arrow-up-right">
            Open in new tab
          </Button>
          <Button variant="secondary" icon="plus" iconPosition="start">
            Add reference
          </Button>
          <Button variant="ghost" icon="instagram" iconPosition="start">
            Instagram
          </Button>
          <Button variant="ghost" icon="facebook" iconPosition="start">
            Facebook
          </Button>
          <Button variant="link" icon="arrow-right">
            See all artists
          </Button>
          <Button icon="arrow-right" disabled>
            Disabled keeps icon still
          </Button>
        </div>
        <div className="cluster">
          <ButtonLink href="/contact">Link styled as button</ButtonLink>
          <ButtonLink href="/portfolio" variant="secondary">
            View portfolio
          </ButtonLink>
        </div>
        <p className="small muted">
          Icon only: a square at each size, label required (it becomes the
          accessible name).
        </p>
        <div className="cluster">
          <IconButton icon="plus" label="Add" size="sm" />
          <IconButton icon="plus" label="Add" />
          <IconButton icon="plus" label="Add" size="lg" />
          <IconButton icon="arrow-right" label="Next" variant="secondary" />
          <IconButton
            icon="arrow-right"
            label="Next"
            variant="secondary"
            disabled
          />
          <IconButtonLink
            href="https://www.instagram.com/"
            icon="instagram"
            label="Instagram"
            variant="ghost"
          />
          <IconButtonLink
            href="https://www.facebook.com/"
            icon="facebook"
            label="Facebook"
            variant="ghost"
          />
          <IconButtonLink
            href="https://www.facebook.com/"
            icon="facebook"
            label="Facebook"
            variant="secondary"
            size="lg"
          />
        </div>
      </Section>

      <Section id="forms" title="Form fields">
        <form className="sg-form" noValidate>
          <Field id="sg-name" label="Name">
            {(control) => (
              <input
                {...control}
                name="name"
                type="text"
                placeholder="Your name"
              />
            )}
          </Field>
          <Field
            id="sg-email"
            label="Email"
            hint="Where we reply. We don't share it."
            error="Enter an email address like name@example.com."
          >
            {(control) => (
              <input
                {...control}
                name="email"
                type="email"
                defaultValue="not-an-email"
              />
            )}
          </Field>
          <Field id="sg-artist" label="Artist">
            {(control) => (
              <select {...control} name="artist">
                <option>No preference</option>
                <option>Artist one</option>
                <option>Artist two</option>
              </select>
            )}
          </Field>
          <Field id="sg-idea" label="Tell us about your idea">
            {(control) => <textarea {...control} name="idea" rows={4} />}
          </Field>
          <fieldset className="fieldset">
            <legend className="field__label">Checked and unchecked</legend>
            <label className="check">
              <input type="checkbox" name="first-tattoo" defaultChecked />
              <span>This is my first tattoo</span>
            </label>
            <label className="check">
              <input type="checkbox" name="cover-up" />
              <span>This covers up an existing tattoo</span>
            </label>
            <label className="check">
              <input type="radio" name="sg-color" defaultChecked />
              <span>Black and gray</span>
            </label>
            <label className="check">
              <input type="radio" name="sg-color" />
              <span>Color</span>
            </label>
          </fieldset>
          <p className="form-status">
            <strong>Something went wrong.</strong> We couldn&rsquo;t send your
            message. Please try again in a moment.
          </p>
          <Button type="submit">Send</Button>
        </form>
      </Section>

      <Section id="tabs" title="Tabs">
        <Label>
          RadioTabs: one choice that swaps the content after it (the request
          form&rsquo;s tattoo or question versions). Radios, so the choice is
          sent and works without scripts; the chosen tab has a gold underline,
          ink text and weight.
        </Label>
        <div className="sg-narrow">
          <RadioTabs
            name="sg-tabs"
            legend="Tabs demo"
            options={["A new tattoo", "A question"]}
          />
        </div>
      </Section>

      <Section id="chips" title="Choice chips">
        <Label>
          Answers to pick from (radios). A pill with a dot, so it never reads as
          a button: chosen is a raised fill, an ink edge, a gold dot and weight.
          Shown beside the primary button for contrast.
        </Label>
        <fieldset className="fieldset">
          <legend className="field__label">Size</legend>
          <div className="choice-list">
            {["Small", "Medium", "Large", "Not sure"].map((option, index) => (
              <label key={option} className="choice-chip">
                <input
                  type="radio"
                  name="sg-chips"
                  value={option}
                  defaultChecked={index === 1}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="cluster">
          <Button icon="arrow-right">Send request</Button>
        </div>
      </Section>

      <Section id="filters" title="Filter chips">
        <ul className="filter-list">
          {["All", "Artist one", "Artist two", "Artist three"].map(
            (label, index) => (
              <li key={label}>
                <span
                  className="filter-chip"
                  aria-current={index === 0 ? "page" : undefined}
                >
                  {label}
                </span>
              </li>
            ),
          )}
        </ul>
      </Section>

      <Section id="cards" title="Cards and grid">
        <div className="sg-gallery">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="sg-tile sg-tile--piece">
              4:5 piece tile
            </div>
          ))}
        </div>
        <div className="artist-grid">
          {["Artist one", "Artist two", "Artist three"].map((name) => (
            <div key={name}>
              <div className="sg-tile sg-tile--portrait">3:4 portrait</div>
              <h3 className="artist-card__name">{name}</h3>
              <p className="artist-card__meta">Fine line, Traditional</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="filmstrip" title="Filmstrip">
        <p className="muted measure">
          Pieces ticked &ldquo;Show in filmstrip&rdquo; in Keystatic. Three
          columns on phones and tablets; one row from lg, where the hovered or
          focused frame widens.
        </p>
        <Filmstrip pieces={filmstrip} artists={artists} />
      </Section>

      <Section id="hero" title="Hero">
        <p className="muted measure">
          Top of every page, edited per page in Keystatic&rsquo;s &ldquo;Page
          heroes&rdquo; entry. The homepage sets the heading at the display
          size; other pages use the h1 size and can add a photo on either side
          (under the text on phones). These demos use a &lt;p&gt; for the
          heading only because this page already has its h1.
        </p>
        {heroDemos.map(({ label, size, hero }) => (
          <div key={label} className="stack stack--sm">
            <p className="caption">{label}</p>
            <Hero
              hero={hero}
              fallbackHeading="Hero"
              size={size}
              headingAs="p"
              pinned={false}
            />
          </div>
        ))}
        <ShopPromises
          promises={[
            "Rooted in American traditional",
            "Walk-ins & appointments",
            "Free consultations. Always.",
          ]}
        />
      </Section>
    </div>
  );
}
