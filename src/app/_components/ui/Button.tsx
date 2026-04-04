import type { ComponentPropsWithoutRef } from "react";

type ButtonVariant = "primary" | "outline" | "ghost";

type ButtonProps = {
  variant?: ButtonVariant;
} & ComponentPropsWithoutRef<"button">;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "rounded-md bg-background-primary px-4 py-3 text-sm font-medium text-text-on-primary",
  outline:
    "rounded-md border border-border-default bg-surface px-4 py-2 text-base font-semibold text-text-heading",
  ghost: "text-text-muted transition-colors hover:text-text-heading",
};

export default function Button({
  variant = "ghost",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`${variantClasses[variant]}${className ? ` ${className}` : ""}`}
      {...props}
    />
  );
}
