import type { MetadataRoute } from "next";
import { getArtists, getPieces } from "@/lib/content";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [artists, pieces] = await Promise.all([getArtists(), getPieces()]);

  const paths = [
    "",
    "/artists",
    "/portfolio",
    "/aftercare",
    "/faq",
    "/contact",
    ...artists.flatMap(({ slug }) => [
      `/artists/${slug}`,
      `/artists/${slug}/portfolio`,
    ]),
    ...pieces.map(({ slug }) => `/portfolio/${slug}`),
  ];

  return paths.map((path) => ({ url: `${siteUrl}${path}` }));
}
