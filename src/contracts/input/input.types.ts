export const INPUT_VARIANTS = ["default", "error", "radio"] as const;

export type InputVariant = (typeof INPUT_VARIANTS)[number];

export const INPUT_VARIANT_CLASSES: Record<InputVariant, string> = {
  default:
    "rounded-md border border-border-default bg-background-page px-3 py-2 text-sm text-text-heading placeholder:text-text-muted focus:border-interactive-primary focus:outline-none",
  error:
    "rounded-md border border-red-500 bg-background-page px-3 py-2 text-sm text-text-heading placeholder:text-text-muted focus:border-red-500 focus:outline-none",
  radio: "size-5 accent-background-primary",
};
