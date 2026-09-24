import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { siteName } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Aftercare",
  description: `How to care for a new tattoo from ${siteName}.`,
  path: "/aftercare",
});

export default function AftercarePage() {
  return (
    <div className="stack">
      <h1>Aftercare</h1>
      <p className="muted measure">
        Aftercare instructions are coming soon. If you have a question about a
        healing tattoo, please{" "}
        <Link href="/contact" className="link">
          get in touch
        </Link>
        .
      </p>
    </div>
  );
}
