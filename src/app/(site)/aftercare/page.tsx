import type { Metadata } from "next";
import Link from "next/link";
import { RichText } from "@/components/rich-text";
import { Hero } from "@/components/hero";
import { getAftercare, getHero } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { siteName } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Aftercare",
  description: `How to care for a new tattoo from ${siteName}.`,
  path: "/aftercare",
});

export default async function AftercarePage() {
  const [content, hero] = await Promise.all([
    getAftercare(),
    getHero("aftercare"),
  ]);

  return (
    <div className="stack stack--lg">
      {/* The Aftercare entry's own intro stands in until the hero has one. */}
      <Hero
        hero={{ ...hero, intro: hero.intro || content?.intro || "" }}
        fallbackHeading="Aftercare"
      />

      {content ? (
        <>
          {content.steps.length > 0 && (
            <ol className="aftercare-steps">
              {content.steps.map((step, index) => (
                <li key={step.title} className="aftercare-step">
                  <span aria-hidden="true" className="aftercare-step__number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="stack stack--sm">
                    <h2 className="heading-3">{step.title}</h2>
                    <p className="measure">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div className="aftercare-warning">
            <h2 className="heading-3">When to get help</h2>
            <RichText node={content.warning} />
          </div>
        </>
      ) : (
        <p className="muted measure">
          Aftercare instructions haven&rsquo;t been added yet. If you have a
          question about a healing tattoo, please{" "}
          <Link href="/contact" className="link">
            get in touch
          </Link>
          .
        </p>
      )}
    </div>
  );
}
