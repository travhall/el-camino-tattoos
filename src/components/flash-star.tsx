/**
 * A tattoo-flash star, inlined so it takes the surrounding text color.
 * Decorative: hidden from assistive tech, the text next to it carries the
 * meaning.
 */
export function FlashStar({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 60"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="m30 2 5 18 15-10-10 15 18 5-18 5 10 15-15-10-5 18-5-18-15 10 10-15-18-5 18-5-10-15 15 10ZM30 24a6 6 0 1 0 0 12 6 6 0 1 0 0-12Z"
      />
    </svg>
  );
}
