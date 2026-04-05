import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { BUTTON_VARIANT_CLASSES } from "@/contracts/button";
import type { ButtonVariant } from "@/contracts/button";

type ButtonProps = {
  variant?: ButtonVariant;
} & ComponentPropsWithoutRef<"button">;

export default function Button({
  variant = "ghost",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={clsx(BUTTON_VARIANT_CLASSES[variant], className)}
      {...props}
    />
  );
}
