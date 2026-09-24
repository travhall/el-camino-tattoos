export const siteName = "El Camino Tattoos";

/**
 * Netlify provides `URL` (the primary site URL) at build time, so this needs
 * no configuration until a custom domain is attached.
 */
export const siteUrl = (process.env.URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

/** `tel:` link for a phone number typed any way an editor likes. */
export const phoneHref = (phone: string) =>
  `tel:${phone.replace(/[^\d+]/g, "")}`;
