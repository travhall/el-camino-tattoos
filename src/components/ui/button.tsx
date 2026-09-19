import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

// Styles live in src/styles/components.css (.button, .button--*).
const variants = {
  primary: "",
  secondary: "button--secondary",
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
  ...props
}: Options & React.ComponentPropsWithoutRef<"button">) {
  return (
    <button
      type={type}
      className={[buttonClasses({ variant, size }), className]
        .filter(Boolean)
        .join(" ")}
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
