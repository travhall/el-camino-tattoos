import {
  collection,
  type ComponentSchema,
  config,
  fields,
  singleton,
} from "@keystatic/core";
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

// A list of profile links, each shown as an icon (src/lib/socials.ts): the
// shop's in the header, an artist's on their page.
function socialLinksField(label: string, description: string) {
  return fields.array(
    fields.object({
      platform: fields.select({
        label: "Platform",
        options: Object.entries(socialPlatforms).map(([value, { label }]) => ({
          value,
          label,
        })),
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
      label,
      description,
      itemLabel: (props) =>
        `${props.fields.platform.value === "other" ? props.fields.label.value || "Other" : (socialPlatforms[props.fields.platform.value as SocialPlatform]?.label ?? "")}: ${props.fields.url.value}`,
    },
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

// A panel at the foot of a page: a heading, a short paragraph and one button.
function closingPanelField(
  label: string,
  description: string,
  defaultButton: string,
) {
  return fields.object(
    {
      heading: fields.text({ label: "Heading" }),
      intro: fields.text({ label: "Text", multiline: true }),
      buttonLabel: fields.text({
        label: "Button label",
        description: `Leave empty for “${defaultButton}”.`,
      }),
    },
    { label, description },
  );
}

// One page's entry under Pages: its hero, plus anything else the page has
// (home adds the promises and the artists section). Each page is its own
// file in content/pages/, so editing one page never means scrolling past
// the others.
function pageSingleton<Extra extends Record<string, ComponentSchema>>(
  label: string,
  path: string,
  extra: Extra = {} as Extra,
) {
  return singleton({
    label,
    path: `content/pages/${path}`,
    format: { data: "yaml" },
    schema: { hero: heroField("Hero"), ...extra },
  });
}

export default config({
  storage: useGitHub
    ? { kind: "github", repo: { owner: "travhall", name: "el-camino-tattoos" } }
    : { kind: "local" },

  ui: {
    brand: { name: "El Camino Tattoos" },
    navigation: {
      Shop: ["shopContact", "shopHours", "shopSocials", "shopSearch"],
      Pages: [
        "pageHome",
        "pageArtists",
        "pagePortfolio",
        "pageAftercare",
        "pageFaq",
        "pageContact",
      ],
      Work: ["artists", "pieces"],
    },
  },

  collections: {
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
        links: socialLinksField(
          "Other links",
          "Optional. A website, a flash shop, TikTok and so on, shown as icons beside Instagram on the artist's page.",
        ),
        booking: fields.object(
          {
            status: fields.select({
              label: "Status",
              options: [
                { label: "Don't show", value: "hidden" },
                { label: "Books open", value: "open" },
                { label: "Waitlist", value: "waitlist" },
                { label: "Books closed", value: "closed" },
              ],
              defaultValue: "hidden",
            }),
            note: fields.text({
              label: "Note",
              description:
                'Optional, shown after the status. e.g. "March dates go out Feb 1."',
            }),
          },
          {
            label: "Booking status",
            description:
              "Optional. Shown on the artist's page and card. Only turn it on if someone will keep it current: an out-of-date status sends clients the wrong way. Leave it on Don't show otherwise.",
          },
        ),
        startedYear: fields.integer({
          label: "Tattooing since",
          description: "Optional. The year they started, e.g. 2014.",
        }),
        favorites: fields.array(fields.text({ label: "Subject" }), {
          label: "Loves to tattoo",
          description:
            "Optional. A few subjects they most enjoy, e.g. Panthers, Roses, Daggers.",
          itemLabel: (props) => props.value,
        }),
        walkIns: fields.text({
          label: "Walk-ins",
          description:
            'Optional. When they take walk-ins, e.g. "Fridays, when the chair\'s free".',
        }),
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
          description:
            "Shows in the artist's featured work at the top of their page (up to 3, newest first) and first in the portfolio. Fewer than 3 ticked? Their newest other pieces fill the rest.",
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
    shopContact: singleton({
      label: "Contact & location",
      path: "content/shop/contact",
      format: { data: "yaml" },
      schema: {
        phone: fields.text({ label: "Phone" }),
        email: fields.text({ label: "Email" }),
        street: fields.text({ label: "Street address" }),
        city: fields.text({ label: "City" }),
        region: fields.text({ label: "State" }),
        postalCode: fields.text({ label: "ZIP code" }),
      },
    }),

    shopHours: singleton({
      label: "Hours & booking",
      path: "content/shop/hours",
      format: { data: "yaml" },
      schema: {
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
            label: "Opening hours",
            description:
              "In the shop's time zone (Central). The site uses these to say whether the shop is open right now. A day left unticked is closed.",
          },
        ),
        walkIns: fields.checkbox({
          label: "Walk-ins welcome",
          description:
            "Shows the walk-in note in the header, the footer and on the contact page.",
          defaultValue: false,
        }),
        walkInNote: fields.text({
          label: "Walk-in note",
          description: "e.g. Walk-ins welcome today until 6.",
        }),
        consultationNote: fields.text({
          label: "Consultation note",
          description: "Shown on the contact page. e.g. Free consultations.",
        }),
        depositAmount: fields.integer({
          label: "Deposit (USD)",
          description: "Shown on the contact page. Leave empty to hide.",
        }),
      },
    }),

    shopSocials: singleton({
      label: "Social links",
      path: "content/shop/socials",
      format: { data: "yaml" },
      schema: {
        links: socialLinksField(
          "Social links",
          "Shown as icons in the header, in this order. Pick Other for a platform without its own icon yet; it gets a generic link icon.",
        ),
      },
    }),

    shopSearch: singleton({
      label: "Search & sharing",
      path: "content/shop/search",
      format: { data: "yaml" },
      schema: {
        description: fields.text({
          label: "Site description",
          description:
            "One or two sentences for search results and link previews. Pages without their own description use this one.",
          multiline: true,
        }),
      },
    }),

    pageHome: pageSingleton("Home", "home", {
      promises: fields.array(fields.text({ label: "Promise" }), {
        label: "Shop promises",
        description: "Three short lines shown in a strip under the filmstrip.",
        itemLabel: (props) => props.value || "Promise",
      }),
      artists: fields.object(
        {
          eyebrow: fields.text({ label: "Eyebrow" }),
          heading: fields.text({
            label: "Heading",
            description: "Leave empty for “Our artists”.",
          }),
          intro: fields.text({ label: "Intro", multiline: true }),
          buttonLabel: fields.text({
            label: "Button label",
            description:
              "Goes to the Artists page. Leave empty for “Meet the team”.",
          }),
        },
        {
          label: "Artists section",
          description:
            "The section with the artists' photos further down the page.",
        },
      ),
      steps: fields.object(
        {
          heading: fields.text({
            label: "Heading",
            description: "Leave empty for “What to expect”.",
          }),
          items: fields.array(
            fields.object({
              title: fields.text({ label: "Step" }),
              text: fields.text({ label: "Detail", multiline: true }),
            }),
            {
              label: "Steps",
              description:
                "Numbered in this order. Five fit one row on wide screens. If a step names the deposit, keep it in line with Shop → Hours & booking.",
              itemLabel: (props) => props.fields.title.value || "Step",
            },
          ),
        },
        {
          label: "What to expect",
          description:
            "The numbered steps at the foot of the page. Hidden when there are no steps.",
        },
      ),
    }),
    pageArtists: pageSingleton("Artists", "artists", {
      match: closingPanelField(
        "Help choosing",
        "The first panel under the artists, for clients who don't know who to ask. Its button goes to the request form.",
        "Request an appointment",
      ),
      guests: closingPanelField(
        "Guest artists",
        "The second panel, for tattooers asking about a guest spot. Its button emails the shop (Shop → Contact & location), or opens the contact form when there is no email. Leave the heading empty to hide this panel.",
        "Send your portfolio",
      ),
    }),
    pagePortfolio: pageSingleton("Portfolio", "portfolio"),
    pageAftercare: pageSingleton("Aftercare", "aftercare"),
    pageFaq: pageSingleton("FAQ", "faq"),
    pageContact: pageSingleton("Contact", "contact"),
  },
});
