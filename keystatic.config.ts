import { collection, config, fields, singleton } from "@keystatic/core";
import { type SocialPlatform, socialPlatforms } from "./src/lib/socials";

// One day of opening hours. Times are 24-hour "HH:MM" so the site can work
// out whether the shop is open right now (src/lib/hours.ts).
const hourPattern = {
  regex: /^$|^([01]\d|2[0-3]):[0-5]\d$/,
  message: "Use 24-hour time, like 12:00 or 20:00",
};
function dayHoursField(label: string) {
  return fields.object(
    {
      open: fields.checkbox({ label: "Open" }),
      opens: fields.text({
        label: "Opens",
        description: "e.g. 12:00",
        validation: { pattern: hourPattern },
      }),
      closes: fields.text({
        label: "Closes",
        description: "e.g. 20:00",
        validation: { pattern: hourPattern },
      }),
    },
    { label, layout: [4, 4, 4] },
  );
}

// The hero at the top of one page (src/components/hero.tsx). Every field
// may be left empty: an empty heading falls back to the page's name, and
// anything else empty simply isn't shown. A button needs both its label and
// its link.
function heroField(label: string) {
  const button = (buttonLabel: string) =>
    fields.object(
      {
        label: fields.text({ label: "Label" }),
        href: fields.text({
          label: "Link",
          description: "A page on this site, like /contact, or a full URL.",
        }),
      },
      { label: buttonLabel, layout: [6, 6] },
    );
  return fields.object(
    {
      eyebrow: fields.text({
        label: "Eyebrow",
        description: "A short line above the heading, set in capitals.",
      }),
      heading: fields.text({
        label: "Heading",
        description:
          "The page's main heading. Put each line on its own line, or leave it to wrap.",
        multiline: true,
      }),
      intro: fields.text({
        label: "Intro",
        description: "One or two sentences under the heading.",
        multiline: true,
      }),
      primary: button("Main button"),
      secondary: button("Second button"),
      image: fields.image({
        label: "Photo",
        description:
          "Optional. Shown beside the text from desktop width and under it on phones. Portrait works best; about 1600px tall, under 1MB.",
        directory: "public/images/heroes",
        publicPath: "/images/heroes/",
      }),
      imageAlt: fields.text({
        label: "Photo description",
        description:
          "What the photo shows, for people who can't see it. Needed when there's a photo.",
      }),
      imagePosition: fields.select({
        label: "Photo side",
        options: [
          { label: "Right", value: "right" },
          { label: "Left", value: "left" },
        ],
        defaultValue: "right",
      }),
    },
    { label },
  );
}

// Once the GitHub App exists, its public slug is set (in Netlify), and edits
// commit to GitHub, which triggers a rebuild. Without it (local dev, CI),
// edits write straight to the working tree. The slug is a NEXT_PUBLIC_ var so
// the client and server bundles agree. To run the one-time GitHub App setup
// from `pnpm dev`, set NEXT_PUBLIC_KEYSTATIC_STORAGE=github.
const useGitHub =
  Boolean(process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG) ||
  process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === "github";

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

// The formatting an editor gets in Aftercare and FAQ text. Headings start at
// 2 because each page supplies its own <h1>; no images, tables or code, so the
// page can't be broken from the editor.
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
  });

export default config({
  storage: useGitHub
    ? { kind: "github", repo: { owner: "travhall", name: "el-camino-tattoos" } }
    : { kind: "local" },

  ui: {
    brand: { name: "El Camino Tattoos" },
    navigation: {
      Shop: ["site"],
      Pages: ["heroes", "aftercare", "faq"],
      Content: ["artists", "pieces"],
    },
  },

  collections: {
    faq: collection({
      label: "FAQ",
      slugField: "question",
      path: "content/faq/*",
      format: { contentField: "answer" },
      columns: ["question", "order"],
      schema: {
        question: fields.slug({
          name: {
            label: "Question",
            description:
              "As a visitor would ask it. e.g. How much is a deposit?",
          },
        }),
        order: fields.integer({
          label: "Order",
          description: "Lower numbers appear first.",
          defaultValue: 100,
        }),
        answer: richText("Answer", { headings: false }),
      },
    }),

    artists: collection({
      label: "Artists",
      slugField: "name",
      path: "content/artists/*",
      format: { data: "yaml" },
      columns: ["name", "role", "order"],
      schema: {
        name: fields.slug({ name: { label: "Name" } }),
        photo: fields.image({
          label: "Photo",
          description: "Portrait for the profile and artist cards.",
          directory: "public/images/artists",
          publicPath: "/images/artists/",
        }),
        specialties: fields.array(fields.text({ label: "Specialty" }), {
          label: "Specialties",
          description: "Short, specific styles. e.g. Fine line, Traditional.",
          itemLabel: (props) => props.value,
        }),
        bio: fields.text({ label: "Bio", multiline: true }),
        instagram: instagramField(),
        order: fields.integer({
          label: "Order",
          description: "Lower numbers appear first.",
          defaultValue: 100,
        }),
        role: fields.select({
          label: "Role",
          description:
            "Resident (own chair, regular schedule), apprentice, or guest (visiting for a limited window).",
          options: [
            { label: "Resident", value: "resident" },
            { label: "Apprentice", value: "apprentice" },
            { label: "Guest", value: "guest" },
          ],
          defaultValue: "resident",
        }),
        visitDates: fields.text({
          label: "Visiting dates",
          description:
            'Guest artists only — e.g. "Nov 14–16". Leave blank for residents and apprentices.',
        }),
      },
    }),

    pieces: collection({
      label: "Portfolio pieces",
      slugField: "title",
      path: "content/pieces/*",
      format: { data: "yaml" },
      columns: ["title", "artist"],
      schema: {
        title: fields.slug({
          name: {
            label: "Title",
            description: "A short name for this piece. e.g. Koi sleeve.",
          },
        }),
        artist: fields.relationship({
          label: "Artist",
          collection: "artists",
          validation: { isRequired: true },
        }),
        image: fields.image({
          label: "Image",
          description: "Resize to about 2400px on the long edge, under 1MB.",
          directory: "public/images/pieces",
          publicPath: "/images/pieces/",
          validation: { isRequired: true },
        }),
        featured: fields.checkbox({
          label: "Featured",
          description: "Show this piece first.",
          defaultValue: false,
        }),
        filmstrip: fields.checkbox({
          label: "Show in filmstrip",
          description:
            "The strip of work on the homepage. Shows up to 9, in portfolio order; if none are ticked, the newest pieces show.",
          defaultValue: false,
        }),
        // Everything below is optional so publishing stays a two-field job.
        style: fields.text({ label: "Style" }),
        placement: fields.text({ label: "Placement" }),
        date: fields.date({ label: "Date" }),
      },
    }),
  },

  singletons: {
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

    heroes: singleton({
      label: "Page heroes",
      path: "content/heroes",
      format: { data: "yaml" },
      schema: {
        home: heroField("Home"),
        artists: heroField("Artists"),
        portfolio: heroField("Portfolio"),
        aftercare: heroField("Aftercare"),
        faq: heroField("FAQ"),
        contact: heroField("Contact"),
      },
    }),

    site: singleton({
      label: "Shop info",
      path: "content/site",
      format: { data: "yaml" },
      schema: {
        description: fields.text({
          label: "Site description",
          description:
            "One or two sentences for search results and link previews.",
          multiline: true,
        }),
        phone: fields.text({ label: "Phone" }),
        email: fields.text({ label: "Email" }),
        street: fields.text({ label: "Street address" }),
        city: fields.text({ label: "City" }),
        region: fields.text({ label: "State" }),
        postalCode: fields.text({ label: "ZIP code" }),
        hours: fields.object(
          {
            monday: dayHoursField("Monday"),
            tuesday: dayHoursField("Tuesday"),
            wednesday: dayHoursField("Wednesday"),
            thursday: dayHoursField("Thursday"),
            friday: dayHoursField("Friday"),
            saturday: dayHoursField("Saturday"),
            sunday: dayHoursField("Sunday"),
          },
          {
            label: "Hours",
            description:
              "In the shop's time zone (Central). The site uses these to say whether the shop is open right now. A day left unticked is closed.",
          },
        ),
        walkIns: fields.checkbox({
          label: "Walk-ins welcome",
          description: "Shows the note below on the homepage and contact page.",
          defaultValue: false,
        }),
        walkInNote: fields.text({
          label: "Walk-in note",
          description: "e.g. Walk-ins welcome today until 6.",
        }),
        consultationNote: fields.text({
          label: "Consultation note",
          description: "e.g. Free consultations.",
        }),
        shopPromises: fields.array(fields.text({ label: "Promise" }), {
          label: "Shop promises",
          description: "Three short lines shown in a strip under the hero.",
          itemLabel: (props) => props.value || "Promise",
        }),
        footerTagline: fields.text({
          label: "Footer tagline",
          description: "A short line next to the logo in the footer.",
        }),
        footerSignoff: fields.text({
          label: "Footer sign-off",
          description: "A short line at the bottom right of the footer.",
        }),
        depositAmount: fields.integer({
          label: "Deposit (USD)",
          description: "Shown on the contact page. Leave empty to hide.",
        }),
        socials: fields.array(
          fields.object({
            platform: fields.select({
              label: "Platform",
              options: Object.entries(socialPlatforms).map(
                ([value, { label }]) => ({ value, label }),
              ),
              defaultValue: "instagram",
            }),
            url: fields.text({
              label: "Link",
              description:
                "The full profile address, e.g. https://www.instagram.com/yourshop/. For Instagram the handle alone also works.",
            }),
            label: fields.text({
              label: "Name (Other only)",
              description:
                "What the link is called for screen readers, e.g. TikTok. Only used when the platform is Other.",
            }),
          }),
          {
            label: "Social links",
            description:
              "Shown as icons in the header, in this order. Pick Other for a platform without its own icon yet; it gets a generic link icon.",
            itemLabel: (props) =>
              `${props.fields.platform.value === "other" ? props.fields.label.value || "Other" : (socialPlatforms[props.fields.platform.value as SocialPlatform]?.label ?? "")}: ${props.fields.url.value}`,
          },
        ),
      },
    }),
  },
});
