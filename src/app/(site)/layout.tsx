import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { siteName, siteUrl } from "@/lib/site";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: "El Camino Tattoos",
  openGraph: { siteName, type: "website", locale: "en_US" },
  twitter: { card: "summary" },
};

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
    </div>
  );
}
