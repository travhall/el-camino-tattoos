import { NauticalStar } from "@/components/nautical-star";

/** The shop's short promises, separated by stars. Renders nothing if there are none. */
export function ShopPromises({ promises }: { promises: readonly string[] }) {
  if (promises.length === 0) return null;

  return (
    <ul className="shop-promises" aria-label="What to expect">
      {promises.map((promise, index) => (
        <li key={promise} className="shop-promises__item">
          {index > 0 && <NauticalStar className="shop-promises__star" />}
          <span>{promise}</span>
        </li>
      ))}
    </ul>
  );
}
