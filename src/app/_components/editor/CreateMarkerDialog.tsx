"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MARKER_TYPES, type MarkerType } from "@/contracts/marker";
import { formatTimestamp } from "@/utils/time";
import Dialog from "@/app/_components/ui/Dialog";
import Button from "@/app/_components/ui/Button";
import MarkerTypeOption from "./MarkerTypeOption";
import AdPickerStep from "./AdPickerStep";

type Step = "type" | "ads";

type CreateMarkerDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (type: MarkerType, adIds: string[]) => void;
  onAutoCreate: () => void;
  currentTime: number;
};

const STEP_TITLES: Record<Step, string> = {
  type: "Create ad marker",
  ads: "Assign ads",
};

function subtitleForStep(step: Step, currentTime: number, type: MarkerType) {
  if (step === "type") {
    return `Marker will be placed at ${formatTimestamp(currentTime)}`;
  }
  return type === "STATIC"
    ? "Select one ad for this marker"
    : "Select ads for A/B testing";
}

export default function CreateMarkerDialog({
  open,
  onClose,
  onConfirm,
  onAutoCreate,
  currentTime,
}: CreateMarkerDialogProps) {
  const [step, setStep] = useState<Step>("type");
  const [selectedType, setSelectedType] = useState<MarkerType>("STATIC");
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setStep("type");
      setSelectedType("STATIC");
    }
    prevOpenRef.current = open;
  }, [open]);

  const reset = useCallback(() => {
    setStep("type");
  }, []);

  function handleClose() {
    reset();
    onClose();
  }

  function handleTypeNext() {
    if (selectedType === "AUTO") {
      onAutoCreate();
      handleClose();
      return;
    }
    setStep("ads");
  }

  function handleAdsConfirm(adIds: string[]) {
    onConfirm(selectedType, adIds);
    handleClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={STEP_TITLES[step]}
      subtitle={subtitleForStep(step, currentTime, selectedType)}
    >
      {step === "type" && (
        <>
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
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleTypeNext}
            >
              {selectedType === "AUTO" ? "Create marker" : "Next"}
            </Button>
          </div>
        </>
      )}

      {step === "ads" && (
        <AdPickerStep
          key={selectedType}
          mode={selectedType === "STATIC" ? "single" : "multi"}
          onConfirm={handleAdsConfirm}
          onBack={() => setStep("type")}
        />
      )}
    </Dialog>
  );
}
