"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useToast } from "@/hooks/useToast";
import { TOAST_VARIANT_CLASSES } from "@/contracts/toast";
import type { ToastVariant } from "@/contracts/toast";

const toastBase =
  "min-w-toast-min-width max-w-toast-max-width rounded-toast p-toast-padding text-sm font-medium shadow-lg transition-all duration-300";

const toastVisibility = {
  visible: "translate-y-0 opacity-100",
  hidden: "translate-y-2 opacity-0",
};

type ToastItemArgs = {
  id: number;
  message: string;
  variant: ToastVariant;
  onDismiss: (id: number) => void;
};

function ToastItem({ id, message, variant, onDismiss }: ToastItemArgs) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(id), 300);
    }, 10000);

    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <div
      role="alert"
      className={clsx(
        toastBase,
        TOAST_VARIANT_CLASSES[variant],
        visible ? toastVisibility.visible : toastVisibility.hidden,
      )}
    >
      {message}
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-content-gap-sm">
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          id={t.id}
          message={t.message}
          variant={t.variant}
          onDismiss={dismiss}
        />
      ))}
    </div>
  );
}
