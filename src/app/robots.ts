import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/keystatic", "/api", "/styleguide", "/__forms.html"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
