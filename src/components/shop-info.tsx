import type { Site } from "@/lib/content";
import { phoneHref } from "@/lib/site";

/** The shop's street address, or nothing if it isn't set. */
export function ShopAddress({ site }: { site: Site }) {
  const cityLine = [
    [site.city, site.region].filter(Boolean).join(", "),
    site.postalCode,
  ]
    .filter(Boolean)
    .join(" ");
  if (!site.street && !cityLine) return null;

  return (
    <address className="shop-info__contact">
      <p>
        {site.street}
        {site.street && cityLine && <br />}
        {cityLine}
      </p>
    </address>
  );
}

/** Phone, email and Instagram, each only if set. */
export function ShopContact({ site }: { site: Site }) {
  if (!site.phone && !site.email && !site.instagram) return null;

  return (
    <address className="shop-info__contact">
      {site.phone && (
        <a href={phoneHref(site.phone)} className="link shop-info__link">
          {site.phone}
        </a>
      )}
      {site.email && (
        <a href={`mailto:${site.email}`} className="link shop-info__link">
          {site.email}
        </a>
      )}
      {site.instagram && (
        <a
          href={`https://instagram.com/${site.instagram}`}
          rel="noopener noreferrer"
          className="link shop-info__link"
        >
          @{site.instagram}
        </a>
      )}
    </address>
  );
}

/** Opening hours, or nothing if none are set. */
export function ShopHours({ site }: { site: Site }) {
  if (site.hours.length === 0) return null;

  return (
    <dl className="shop-info__hours">
      {site.hours.map(({ days, time }) => (
        <div key={`${days}-${time}`} className="shop-info__hours-row">
          <dt className="shop-info__days">{days}</dt>
          <dd>{time}</dd>
        </div>
      ))}
    </dl>
  );
}
