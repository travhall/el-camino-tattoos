import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { ShopNotes } from "@/components/shop-notes";
import { getArtists, getSite } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { phoneHref, siteName } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: `Request a tattoo appointment or ask a question at ${siteName}.`,
  path: "/contact",
});

export default async function ContactPage() {
  const [artists, site] = await Promise.all([getArtists(), getSite()]);

  return (
    <div className="stack stack--lg">
      <div className="stack">
        <h1>Contact</h1>
        <p className="lead muted measure">
          Tell us about the tattoo you have in mind and we&rsquo;ll get back to
          you.
        </p>
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
