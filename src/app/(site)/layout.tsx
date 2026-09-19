import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteName, siteUrl } from "@/lib/site";
import "../globals.css";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  display: "swap",
});

// Headings and display type. Variable weight axis: 100-900.
const cosmic = localFont({
  src: "../../../public/fonts/Cosmic-VF.woff2",
  variable: "--font-cosmic",
  weight: "100 900",
  display: "swap",
});

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

export default function SiteLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${cosmic.variable} site`}
    >
      <body className="site__body">
        <SiteHeader />
        <main className="page">{children}</main>
        <SiteFooter />
        {modal}
      </body>
    </html>
  );
}
