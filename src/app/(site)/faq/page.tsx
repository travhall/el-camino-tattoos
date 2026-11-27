import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { getHero } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { siteName } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "FAQ",
  description: `Answers to common questions about getting tattooed at ${siteName}.`,
  path: "/faq",
});

/** The page is its hero, edited under Pages → FAQ in Keystatic. */
export default async function FaqPage() {
  const hero = await getHero("faq");
  return <Hero hero={hero} fallbackHeading="FAQ" />;
}
