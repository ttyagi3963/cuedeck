import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { INPUT_VARIANT_CLASSES } from "@/contracts/input";
import type { InputVariant } from "@/contracts/input";

type InputProps = {
  variant?: InputVariant;
} & ComponentPropsWithoutRef<"input">;

export default function Input({
  variant = "default",
  className,
  ...props
}: InputProps) {
  return (
    <input
      className={clsx(INPUT_VARIANT_CLASSES[variant], className)}
      {...props}
    />
  );
}
