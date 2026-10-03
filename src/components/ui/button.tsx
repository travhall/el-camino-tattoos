import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";

type Variant = "primary" | "secondary" | "ghost" | "link";
type Size = "sm" | "md" | "lg";

// Styles live in src/styles/components.css (.button, .button--*).
const variants = {
  primary: "",
  secondary: "button--secondary",
  ghost: "button--ghost",
  link: "button--link",
} satisfies Record<Variant, string>;

const sizes = {
  sm: "button--sm",
  md: "",
  lg: "button--lg",
} satisfies Record<Size, string>;

type Options = {
  variant?: Variant;
  size?: Size;
  /** Optional line icon; it animates when the button is hovered or focused. */
  icon?: IconName;
  iconPosition?: "start" | "end";
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: Pick<Options, "variant" | "size"> & { className?: string } = {}) {
  return ["button", variants[variant], sizes[size], className]
    .filter(Boolean)
    .join(" ");
}

function ButtonContent({
  icon,
  iconPosition = "end",
  children,
}: Pick<Options, "icon" | "iconPosition"> & { children?: React.ReactNode }) {
  if (!icon) return <>{children}</>;
  const glyph = <Icon name={icon} className="button__icon" />;
  return iconPosition === "start" ? (
    <>
      {glyph}
      {children}
    </>
  ) : (
    <>
      {children}
      {glyph}
    </>
  );
}

export function Button({
  variant,
  size,
  icon,
  iconPosition,
  className,
  type = "button",
  pending = false,
  children,
  ...props
}: Options &
  React.ComponentProps<"button"> & {
    /**
     * Busy but still focusable: use instead of `disabled` while work is in
     * flight. This only sets aria-busy/aria-disabled and the styling; it does
     * NOT block activation, so the caller must ignore activations while pending.
     */
    pending?: boolean;
  }) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      aria-busy={pending || undefined}
      aria-disabled={pending || undefined}
      {...props}
    >
      <ButtonContent icon={icon} iconPosition={iconPosition}>
        {children}
      </ButtonContent>
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  icon,
  iconPosition,
  className,
  children,
  ...props
}: Options & React.ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props}>
      <ButtonContent icon={icon} iconPosition={iconPosition}>
        {children}
      </ButtonContent>
    </Link>
  );
}
