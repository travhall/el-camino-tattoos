/**
 * The nautical star (public/nautical_star.svg), inlined so the points take the
 * surrounding text color. The five facets default to the page background and
 * can be tinted with --star-facet where the star sits on another surface.
 * Decorative: hidden from assistive tech, the text next to it carries the
 * meaning.
 */
const facet = "M0 0v-909.15l-204.117 628.207Z";

export function NauticalStar({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-952 -1001 1904 1811"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        fill="currentColor"
        d="M0-1000-587.785 809.017l1538.842-1118.034H-951.057L587.785 809.017Z"
      />
      <g fill="var(--star-facet, var(--background))">
        {[0, 72, 144, 216, 288].map((angle) => (
          <path key={angle} d={facet} transform={`rotate(${angle})`} />
        ))}
      </g>
    </svg>
  );
}
