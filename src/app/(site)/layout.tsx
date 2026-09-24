import type { Metadata } from "next";
import { Analytics } from "@/components/analytics";
import { SiteShell } from "@/components/site-shell";
import { getSite } from "@/lib/content";
import { siteName, siteUrl } from "@/lib/site";
import "../globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { description } = await getSite();
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    ...(description ? { description } : {}),
    openGraph: { siteName, type: "website", locale: "en_US" },
    twitter: { card: "summary" },
  };
}

export default function SiteLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div className="site-frame">
      <SiteShell>{children}</SiteShell>
      {modal}
      <Analytics />
    </div>
  );
}
