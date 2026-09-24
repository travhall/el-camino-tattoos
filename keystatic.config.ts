import { collection, config, fields, singleton } from "@keystatic/core";

// Once the GitHub App exists, its public slug is set (in Netlify), and edits
// commit to GitHub, which triggers a rebuild. Without it (local dev, CI),
// edits write straight to the working tree. The slug is a NEXT_PUBLIC_ var so
// the client and server bundles agree. To run the one-time GitHub App setup
// from `pnpm dev`, set NEXT_PUBLIC_KEYSTATIC_STORAGE=github.
const useGitHub =
  Boolean(process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG) ||
  process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === "github";

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

export default config({
  storage: useGitHub
    ? { kind: "github", repo: { owner: "travhall", name: "el-camino-tattoos" } }
    : { kind: "local" },

  ui: {
    brand: { name: "El Camino Tattoos" },
    navigation: {
      Shop: ["site"],
      Content: ["artists", "pieces"],
    },
  },

  collections: {
    artists: collection({
      label: "Artists",
      slugField: "name",
      path: "content/artists/*",
      format: { data: "yaml" },
      columns: ["name", "order"],
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
        // Everything below is optional so publishing stays a two-field job.
        style: fields.text({ label: "Style" }),
        placement: fields.text({ label: "Placement" }),
        date: fields.date({ label: "Date" }),
      },
    }),
  },

  singletons: {
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
        hours: fields.array(
          fields.object({
            days: fields.text({
              label: "Days",
              description: "e.g. Monday to Friday",
            }),
            time: fields.text({
              label: "Hours",
              description: "e.g. 12pm to 8pm, or Closed",
            }),
          }),
          {
            label: "Hours",
            itemLabel: (props) =>
              `${props.fields.days.value} ${props.fields.time.value}`.trim(),
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
        depositAmount: fields.integer({
          label: "Deposit (USD)",
          description: "Shown on the contact page. Leave empty to hide.",
        }),
        instagram: instagramField(),
      },
    }),
  },
});
