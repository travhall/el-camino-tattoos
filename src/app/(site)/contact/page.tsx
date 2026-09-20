import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { getArtists } from "@/lib/content";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const artists = await getArtists();

  return (
    <div className="stack stack--lg">
      <div className="stack">
        <h1>Contact</h1>
        <p className="lead muted measure">
          Send a message and we&rsquo;ll get back to you.
        </p>
      </div>
      <ContactForm
        artists={artists.map(({ slug, name }) => ({ slug, name }))}
      />
    </div>
  );
}
