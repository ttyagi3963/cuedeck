"use client";

import { useState } from "react";
import { MARKER_TYPES, type MarkerType } from "@/contracts/marker";
import { formatTimestamp } from "@/utils/time";
import Dialog from "@/app/_components/ui/Dialog";
import Button from "@/app/_components/ui/Button";
import {
  DIALOG_STEPS,
  MARKER_DIALOG_STEP_TITLES,
  type MarkerDialogStep,
} from "./markerUi";
import MarkerTypeOption from "./MarkerTypeOption";
import AdPickerStep from "./AdPickerStep";

type CreateMarkerDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (type: MarkerType, adIds: string[]) => void;
  onAutoCreate: () => void;
  currentTime: number;
};

function subtitleForStep(
  step: MarkerDialogStep,
  currentTime: number,
  type: MarkerType,
) {
  if (step === DIALOG_STEPS.TYPE) {
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
  const [step, setStep] = useState<MarkerDialogStep>(DIALOG_STEPS.TYPE);
  const [selectedType, setSelectedType] = useState<MarkerType>("STATIC");

  function handleClose() {
    onClose();
  }

  function handleTypeNext() {
    if (selectedType === "AUTO") {
      onAutoCreate();
      handleClose();
      return;
    }
    setStep(DIALOG_STEPS.ADS);
  }

  function handleAdsConfirm(adIds: string[]) {
    onConfirm(selectedType, adIds);
    handleClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={MARKER_DIALOG_STEP_TITLES[step]}
      subtitle={subtitleForStep(step, currentTime, selectedType)}
    >
      {step === DIALOG_STEPS.TYPE && (
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

      {step === DIALOG_STEPS.ADS && (
        <AdPickerStep
          key={selectedType}
          mode={selectedType === "STATIC" ? "single" : "multi"}
          onConfirm={handleAdsConfirm}
          onBack={() => setStep(DIALOG_STEPS.TYPE)}
        />
      )}
    </Dialog>
  );
}
