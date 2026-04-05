export const TOAST_VARIANTS = ["error", "success"] as const;

export type ToastVariant = (typeof TOAST_VARIANTS)[number];

export const TOAST_VARIANT_CLASSES: Record<ToastVariant, string> = {
  error: "bg-toast-error-bg text-toast-error-text",
  success: "bg-toast-success-bg text-toast-success-text",
};

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}
