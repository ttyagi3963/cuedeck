"use client";

import {
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import Button from "@/app/_components/ui/Button";
import { Close } from "@/app/_components/ui/icons";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function Dialog({
  open,
  onClose,
  title,
  subtitle,
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

  function handleClick(e: ReactMouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleClick}
      className="m-auto min-w-dialog-min-width max-w-dialog-max-width rounded-dialog border border-border-default bg-surface p-0 shadow-lg backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-dialog-gap p-dialog-padding">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-content-gap-sm">
            <h2 className="text-base font-bold text-text-heading">{title}</h2>
            {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            <Close />
          </Button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
