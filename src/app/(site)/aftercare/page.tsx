import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { getHero } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { siteName } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Aftercare",
  description: `How to care for a new tattoo from ${siteName}.`,
  path: "/aftercare",
});

/** The page is its hero, edited under Pages → Aftercare in Keystatic. */
export default async function AftercarePage() {
  const hero = await getHero("aftercare");
  return <Hero hero={hero} fallbackHeading="Aftercare" />;
}
