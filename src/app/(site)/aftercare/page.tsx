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
    <div className="stack">
      <h1>Aftercare</h1>
      {content ? (
        <RichText node={content} />
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
