"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import Button from "@/app/_components/ui/Button";
import { Close } from "@/app/_components/ui/icons";
import { DIALOG_SIZE_CLASSES, type DialogSize } from "@/lib/constants";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: DialogSize;
  dismissible?: boolean;
  children: ReactNode;
};

export default function Dialog({
  open,
  onClose,
  title,
  subtitle,
  size = "default",
  dismissible = true,
  children,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={dismissible ? onClose : undefined}
      onCancel={(event) => {
        if (!dismissible) {
          event.preventDefault();
        }
      }}
      className={`m-auto ${DIALOG_SIZE_CLASSES[size]} rounded-dialog border border-border-default bg-surface p-0 shadow-lg backdrop:bg-video-bg/50`}
    >
      <div className="flex flex-col gap-dialog-gap p-dialog-padding">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-content-gap-sm">
            <h2 className="text-base font-bold text-text-heading">{title}</h2>
            {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
          </div>
          {dismissible ? (
            <Button variant="ghost" onClick={onClose} aria-label="Close">
              <Close />
            </Button>
          ) : null}
        </div>
        {children}
      </div>
    </dialog>
  );
}
