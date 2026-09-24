import type { Site } from "@/lib/content";
import { phoneHref } from "@/lib/site";

/**
 * Where to find and reach the shop, from the shop info. Every part is optional
 * and renders only when filled in. Links keep a 44px hit area.
 */
export function ShopInfo({ site }: { site: Site }) {
  const cityLine = [
    [site.city, site.region].filter(Boolean).join(", "),
    site.postalCode,
  ]
    .filter(Boolean)
    .join(" ");
  const hasAddress = Boolean(site.street || cityLine);
  const hasContact = hasAddress || site.phone || site.email || site.instagram;
  if (!hasContact && site.hours.length === 0) return null;

  return (
    <div className="shop-info">
      {hasContact && (
        <address className="shop-info__contact">
          {hasAddress && (
            <p>
              {site.street}
              {site.street && cityLine && <br />}
              {cityLine}
            </p>
          )}
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
      )}
      {site.hours.length > 0 && (
        <dl className="shop-info__hours">
          {site.hours.map(({ days, time }) => (
            <div key={`${days}-${time}`} className="shop-info__hours-row">
              <dt className="shop-info__days">{days}</dt>
              <dd>{time}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
