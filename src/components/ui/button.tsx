import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center rounded-full font-medium transition-colors disabled:opacity-50 motion-reduce:transition-none";

const variants = {
  primary: "bg-foreground text-background hover:bg-foreground/85",
  secondary: "border border-foreground/30 hover:bg-foreground/10",
  ghost: "hover:bg-foreground/10",
} satisfies Record<Variant, string>;

const sizes = {
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-1.5",
  lg: "px-6 py-2.5 text-lg",
} satisfies Record<Size, string>;

type Options = { variant?: Variant; size?: Size };

export function buttonClasses({
  variant = "primary",
  size = "md",
}: Options = {}) {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}

export function Button({
  variant,
  size,
  className = "",
  type = "button",
  ...props
}: Options & React.ComponentPropsWithoutRef<"button">) {
  return (
    <button
      type={type}
      className={`${buttonClasses({ variant, size })} ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({
  variant,
  size,
  className = "",
  ...props
}: Options & React.ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      className={`${buttonClasses({ variant, size })} ${className}`}
      {...props}
    />
  );
}
