import Link from "next/link";

type Variant = "primary" | "secondary" | "accent" | "ghost";
type Size = "sm" | "md" | "lg";

// Styles live in src/styles/components.css (.button, .button--*).
const variants = {
  primary: "",
  secondary: "button--secondary",
  accent: "button--accent",
  ghost: "button--ghost",
} satisfies Record<Variant, string>;

const sizes = {
  sm: "button--sm",
  md: "",
  lg: "button--lg",
} satisfies Record<Size, string>;

type Options = { variant?: Variant; size?: Size };

export function buttonClasses({
  variant = "primary",
  size = "md",
}: Options = {}) {
  return ["button", variants[variant], sizes[size]].filter(Boolean).join(" ");
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  pending = false,
  ...props
}: Options &
  React.ComponentPropsWithoutRef<"button"> & {
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
      className={[buttonClasses({ variant, size }), className]
        .filter(Boolean)
        .join(" ")}
      aria-busy={pending || undefined}
      aria-disabled={pending || undefined}
      {...props}
    />
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: Options & React.ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      className={[buttonClasses({ variant, size }), className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
