export type IconName = "arrow-right" | "arrow-up-right" | "plus" | "instagram";

// 24px grid, 1.5 stroke, round caps: one line-icon family. Add a name here and
// a hover motion in components.css (.button__icon[data-icon="..."]).
const paths: Record<IconName, React.ReactNode> = {
  "arrow-right": <path d="M4 12h16m-6-6 6 6-6 6" />,
  "arrow-up-right": <path d="M7 17 17 7M8 7h9v9" />,
  plus: <path d="M12 5v14M5 12h14" />,
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.9" />
      <path d="M17.2 6.8h.01" />
    </>
  ),
};

/**
 * Decorative line icon that takes the surrounding text color. Hidden from
 * assistive tech: the button's text (or its aria-label) carries the meaning.
 */
export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-icon={name}
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
