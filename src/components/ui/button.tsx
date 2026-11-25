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
  iconOnly = false,
  className,
}: Pick<Options, "variant" | "size"> & {
  iconOnly?: boolean;
  className?: string;
} = {}) {
  return [
    "button",
    variants[variant],
    sizes[size],
    iconOnly && "button--icon",
    className,
  ]
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

/**
 * Icon-only button: a square at the button's height (36, 44 or 48px) with the
 * icon centred, scaling with the size. `label` is required and becomes the
 * accessible name. No link variant: underlined text with no text makes no
 * sense.
 */
type IconOnlyOptions = {
  icon: IconName;
  label: string;
  variant?: Exclude<Variant, "link">;
  size?: Size;
};

export function IconButton({
  icon,
  label,
  variant,
  size,
  className,
  type = "button",
  pending = false,
  ...props
}: IconOnlyOptions &
  Omit<React.ComponentProps<"button">, "children" | "aria-label"> & {
    /** Same as Button's `pending`: busy but still focusable. */
    pending?: boolean;
  }) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, iconOnly: true, className })}
      aria-label={label}
      aria-busy={pending || undefined}
      aria-disabled={pending || undefined}
      {...props}
    >
      <Icon name={icon} className="button__icon" />
    </button>
  );
}

export function IconButtonLink({
  icon,
  label,
  variant,
  size,
  className,
  ...props
}: IconOnlyOptions &
  Omit<React.ComponentProps<typeof Link>, "children" | "aria-label">) {
  return (
    <Link
      className={buttonClasses({ variant, size, iconOnly: true, className })}
      aria-label={label}
      {...props}
    >
      <Icon name={icon} className="button__icon" />
    </Link>
  );
}
