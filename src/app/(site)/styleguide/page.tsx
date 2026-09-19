import type { Metadata } from "next";
import { Button, ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Style guide",
  robots: { index: false, follow: false },
};

const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900];

const scale = [
  { name: "text-6xl", className: "text-6xl" },
  { name: "text-5xl", className: "text-5xl" },
  { name: "text-4xl", className: "text-4xl" },
  { name: "text-3xl", className: "text-3xl" },
  { name: "text-2xl", className: "text-2xl" },
  { name: "text-xl", className: "text-xl" },
  { name: "text-base", className: "text-base" },
  { name: "text-sm", className: "text-sm" },
];

const colors = [
  { name: "background", className: "bg-background" },
  { name: "foreground", className: "bg-foreground" },
  { name: "foreground / 70", className: "bg-foreground/70" },
  { name: "foreground / 30", className: "bg-foreground/30" },
  { name: "foreground / 15", className: "bg-foreground/15" },
  { name: "foreground / 5", className: "bg-foreground/5" },
];

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
    <section
      aria-labelledby={`${id}-heading`}
      className="space-y-6 border-t border-foreground/15 pt-8"
    >
      <h2 id={`${id}-heading`} className="text-3xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-foreground/70">{children}</p>;
}

const field =
  "w-full rounded-md border border-foreground/30 bg-background px-3 py-2 placeholder:text-foreground/50";

export default function StyleGuidePage() {
  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <h1 className="text-5xl font-semibold tracking-tight">Style guide</h1>
        <p className="max-w-prose text-foreground/70">
          A working reference for type, color and UI. Placeholder styles until
          the brand is settled. Not indexed.
        </p>
      </header>

      <Section id="typography" title="Typography">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Display: Cosmic (headings)</Label>
            <p className="font-display text-5xl">El Camino Tattoos</p>
          </div>
          <div className="space-y-2">
            <Label>Body: Hanken Grotesk</Label>
            <p className="text-5xl">El Camino Tattoos</p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Cosmic weights (variable, 100 to 900)</Label>
            {weights.map((weight) => (
              <p
                key={weight}
                className="font-display text-2xl"
                style={{ fontWeight: weight }}
              >
                {weight} Fine line, blackwork, traditional
              </p>
            ))}
          </div>
          <div className="space-y-1">
            <Label>Hanken Grotesk weights (variable, 100 to 900)</Label>
            {weights.map((weight) => (
              <p
                key={weight}
                className="text-2xl"
                style={{ fontWeight: weight }}
              >
                {weight} Fine line, blackwork, traditional
              </p>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label>Scale (Tailwind defaults)</Label>
          {scale.map(({ name, className }) => (
            <div
              key={name}
              className="grid items-baseline gap-2 md:grid-cols-[8rem_1fr]"
            >
              <span className="text-sm text-foreground/70">{name}</span>
              <span className={`font-display ${className}`}>
                Custom work, walk-ins, flash
              </span>
            </div>
          ))}
        </div>

        <div className="max-w-prose space-y-3">
          <Label>Body copy</Label>
          <p>
            Keep new tattoos clean and moisturized. Wash gently with
            fragrance-free soap, pat dry, and apply a thin layer of ointment.
            Avoid soaking, direct sun and picking at scabs while it heals.
          </p>
          <p className="text-sm text-foreground/70">
            Secondary text, captions and metadata use the muted foreground.
          </p>
          <p>
            A{" "}
            <a href="#typography" className="underline">
              text link
            </a>{" "}
            sits inline with body copy.
          </p>
        </div>
      </Section>

      <Section id="color" title="Color">
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {colors.map(({ name, className }) => (
            <li key={name} className="space-y-2">
              <div
                className={`h-20 rounded-md border border-foreground/15 ${className}`}
              />
              <p className="text-sm text-foreground/70">{name}</p>
            </li>
          ))}
        </ul>
        <Label>
          Tokens live in globals.css and switch with the system light or dark
          setting.
        </Label>
      </Section>

      <Section id="buttons" title="Buttons">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/contact">Link styled as button</ButtonLink>
            <ButtonLink href="/portfolio" variant="secondary">
              View portfolio
            </ButtonLink>
          </div>
        </div>
      </Section>

      <Section id="forms" title="Form fields">
        <form className="max-w-md space-y-4">
          <div className="space-y-1">
            <label htmlFor="sg-name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="sg-name"
              name="name"
              type="text"
              placeholder="Your name"
              className={field}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="sg-email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="sg-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              className={field}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="sg-artist" className="text-sm font-medium">
              Artist
            </label>
            <select id="sg-artist" name="artist" className={field}>
              <option>No preference</option>
              <option>Artist one</option>
              <option>Artist two</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="sg-idea" className="text-sm font-medium">
              Tell us about your idea
            </label>
            <textarea id="sg-idea" name="idea" rows={4} className={field} />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="first-tattoo" />
            <span>This is my first tattoo</span>
          </label>
          <Button type="submit">Send</Button>
        </form>
      </Section>

      <Section id="filters" title="Filter chips">
        <ul className="flex flex-wrap gap-2">
          {["All", "Artist one", "Artist two", "Artist three"].map(
            (label, index) => (
              <li key={label}>
                <span
                  className={`inline-block rounded-full border border-foreground/30 px-4 py-1.5 text-sm ${
                    index === 0 ? "bg-foreground text-background" : ""
                  }`}
                >
                  {label}
                </span>
              </li>
            ),
          )}
        </ul>
      </Section>

      <Section id="cards" title="Cards and grid">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="aspect-[4/5] bg-foreground/5 p-3 text-sm text-foreground/50"
            >
              4:5 piece tile
            </div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {["Artist one", "Artist two", "Artist three"].map((name) => (
            <div key={name}>
              <div className="aspect-[3/4] bg-foreground/5 p-3 text-sm text-foreground/50">
                3:4 portrait
              </div>
              <h3 className="mt-3 text-lg font-semibold">{name}</h3>
              <p className="text-sm text-foreground/70">
                Fine line, Traditional
              </p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
