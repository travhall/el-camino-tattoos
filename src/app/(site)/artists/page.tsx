import type { Metadata } from "next";
import { ArtistGrid } from "@/components/artist-grid";
import { ButtonLink } from "@/components/ui/button";
import { getArtists, getSite } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { siteName } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Artists",
  description: `The artists at ${siteName}: their styles and their portfolios.`,
  path: "/artists",
});

export default async function ArtistsPage() {
  const [artists, site] = await Promise.all([getArtists(), getSite()]);
  const residents = artists.filter((artist) => artist.role !== "guest");
  const guests = artists.filter((artist) => artist.role === "guest");

  return (
    <div className="stack stack--xl">
      <div className="stack">
        <h1>Artists</h1>
        <p className="lead measure">
          Pick an artist you connect with. Every inquiry comes through the same
          studio inbox, so you can&rsquo;t go wrong asking.
        </p>
      </div>

      <ArtistGrid artists={residents} headingLevel={2} />

      {guests.length > 0 && (
        <section aria-labelledby="guests-heading" className="stack stack--lg">
          <h2 id="guests-heading">Visiting artists</h2>
          <ArtistGrid artists={guests} headingLevel={3} />
        </section>
      )}

      <div className="stack">
        <h2>Not sure who&rsquo;s right for you?</h2>
        <p className="measure">
          Tell us what you&rsquo;re thinking and we&rsquo;ll match your idea
          with the right hands. Each artist keeps their own book, but you only
          need to knock on one door.
        </p>
        <div>
          <ButtonLink href="/contact">Request an appointment</ButtonLink>
        </div>
      </div>

      <div className="stack">
        <h2>Traveling tattooer?</h2>
        <p className="measure">
          We&rsquo;re open to the occasional guest artist who shares our
          approach to tattooing. Our resident crew is full and we aren&rsquo;t
          taking apprentice or new-resident applications right now, but if
          you&rsquo;re passing through, send over your portfolio.
        </p>
        {site.email && (
          <p>
            <a
              href={`mailto:${site.email}?subject=${encodeURIComponent("Guest artist inquiry")}`}
              className="link"
            >
              {site.email}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
