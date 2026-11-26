import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { ShopNotes } from "@/components/shop-notes";
import { Hero } from "@/components/hero";
import { getArtists, getHero, getSite } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { phoneHref, siteName } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: `Request a tattoo appointment or ask a question at ${siteName}.`,
  path: "/contact",
});

export default async function ContactPage() {
  const [artists, site, hero] = await Promise.all([
    getArtists(),
    getSite(),
    getHero("contact"),
  ]);

  return (
    <div className="stack stack--lg">
      <Hero hero={hero} fallbackHeading="Contact" />
      <div className="stack">
        <ShopNotes site={site} />
        {site.phone && (
          <p>
            Prefer to talk?{" "}
            <a href={phoneHref(site.phone)} className="link">
              {site.phone}
            </a>
          </p>
        )}
        {site.depositAmount ? (
          <p className="small muted measure">
            A ${site.depositAmount} deposit holds your appointment.
          </p>
        ) : null}
      </div>
      <ContactForm
        artists={artists.map(({ slug, name }) => ({ slug, name }))}
      />
    </div>
  );
}
