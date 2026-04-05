"use client";

import { useState } from "react";
import { MARKER_TYPES, type MarkerType } from "@/contracts/marker";
import { formatTimestamp } from "@/utils/time";
import Dialog from "@/app/_components/ui/Dialog";
import Button from "@/app/_components/ui/Button";
import MarkerTypeOption from "./MarkerTypeOption";

type CreateMarkerDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (type: MarkerType) => void;
  currentTime: number;
};

export default function CreateMarkerDialog({
  open,
  onClose,
  onConfirm,
  currentTime,
}: CreateMarkerDialogProps) {
  const [selectedType, setSelectedType] = useState<MarkerType>("STATIC");

  function handleConfirm() {
    onConfirm(selectedType);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create ad marker"
      subtitle={`Marker will be placed at ${formatTimestamp(currentTime)}`}
    >
      <fieldset className="flex flex-col gap-content-gap-sm">
        {MARKER_TYPES.map((type) => (
          <MarkerTypeOption
            key={type}
            type={type}
            selected={selectedType === type}
            onSelect={() => setSelectedType(type)}
          />
        ))}
      </fieldset>
      <div className="flex gap-content-gap-sm">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" className="flex-1" onClick={handleConfirm}>
          Select marker
        </Button>
      </div>
    </Dialog>
  );
}
