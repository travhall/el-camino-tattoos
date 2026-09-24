// Routes covered by the accessibility sweep. The fixture slugs come from
// scripts/fixtures.mjs. `/nope` is deliberately unmatched (the 404 page).
export const routes = [
  "/",
  "/artists",
  "/artists/zz-fixture-one",
  "/artists/zz-fixture-one/portfolio",
  "/portfolio",
  "/portfolio/zz-fixture-koi",
  "/aftercare",
  "/faq",
  "/contact",
  "/contact/thanks",
  "/styleguide",
  "/nope",
] as const;

/** Hydration is done once Next has set <html lang> (the 404 shell has none before). */
export const hydrated = "html[lang]";
