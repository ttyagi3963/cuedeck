export const BUTTON_VARIANTS = [
  "primary",
  "outline",
  "ghost",
  "danger",
] as const;

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

export const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-background-primary px-4 py-3 text-sm font-medium text-text-on-primary",
  outline:
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border-default bg-surface px-4 py-2 text-base font-semibold text-text-heading",
  ghost:
    "inline-flex cursor-pointer items-center gap-2 text-text-muted transition-colors hover:text-text-heading",
  danger:
    "inline-flex cursor-pointer items-center justify-center rounded-lg bg-danger-subtle p-2 text-text-danger hover:bg-danger-subtle-hover",
};
