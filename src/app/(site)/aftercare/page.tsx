import type { Metadata } from "next";
import Link from "next/link";
import { RichText } from "@/components/rich-text";
import { getAftercare } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { siteName } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Aftercare",
  description: `How to care for a new tattoo from ${siteName}.`,
  path: "/aftercare",
});

export default async function AftercarePage() {
  const content = await getAftercare();

  return (
    <div className="stack stack--lg">
      <div className="stack">
        <h1>Aftercare</h1>
        {content?.intro ? (
          <p className="lead measure">{content.intro}</p>
        ) : null}
      </div>

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
