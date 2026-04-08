"use client";

import { useState, useCallback } from "react";
import type { Marker } from "@/contracts/marker";
import {
  formatTimestamp,
  parseTime,
  isValidTime,
  formatDurationShort,
} from "@/utils/time";
import Dialog from "@/app/_components/ui/Dialog";
import Button from "@/app/_components/ui/Button";
import Input from "@/app/_components/ui/Input";
import AdPickerStep from "./AdPickerStep";
import {
  DIALOG_STEPS,
  MARKER_TYPE_META,
  type MarkerDialogStep,
} from "./markerUi";
import { useAds } from "@/hooks/useAds";

type EditMarkerDialogProps = {
  marker: Marker;
  onClose: () => void;
  onConfirm: (markerId: string, timeSec: number, adIds: string[]) => void;
};

export default function EditMarkerDialog({
  marker,
  onClose,
  onConfirm,
}: EditMarkerDialogProps) {
  const [step, setStep] = useState<MarkerDialogStep>(DIALOG_STEPS.DETAILS);
  const [timeInput, setTimeInput] = useState(formatTimestamp(marker.timeSec));
  const [adIds, setAdIds] = useState<string[]>(
    marker.markerAds.map((ma) => ma.adId),
  );
  const { data: allAds = [] } = useAds();
  const selectedAds = allAds.filter((ad) => adIds.includes(ad.id));

  const timeValid = isValidTime(timeInput);
  const hasAds = adIds.length > 0;
  const canSave = timeValid && hasAds;

  const errors: string[] = [];
  if (!timeValid)
    errors.push("Time must be in HH:MM:SS format (e.g. 00:00:50)");
  if (!hasAds) errors.push("At least one ad must be assigned");

  const reset = useCallback(() => {
    setStep(DIALOG_STEPS.DETAILS);
  }, []);

  function handleClose() {
    reset();
    onClose();
  }

  function handleSave() {
    const parsed = parseTime(timeInput);
    if (parsed === null || !hasAds) return;
    onConfirm(marker.id, parsed, adIds);
    handleClose();
  }

  function handleAdsConfirm(newAdIds: string[]) {
    setAdIds(newAdIds);
    setStep(DIALOG_STEPS.DETAILS);
  }

  const meta = MARKER_TYPE_META[marker.type];

  const title = step === DIALOG_STEPS.DETAILS ? "Edit marker" : "Change ad";
  const subtitle =
    step === DIALOG_STEPS.DETAILS
      ? `${meta.label} marker`
      : marker.type === "STATIC"
        ? "Select one ad for this marker"
        : "Select ads for A/B testing";

  return (
    <Dialog
      open
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
      size={step === DIALOG_STEPS.ADS ? "wide" : "default"}
    >
      {step === DIALOG_STEPS.DETAILS && (
        <div className="flex flex-col gap-content-gap-sm">
          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="rounded-button-primary border border-danger/30 bg-notification-badge/10 px-3 py-2">
              {errors.map((err) => (
                <p key={err} className="text-xs font-medium text-text-danger-subtle">
                  {err}
                </p>
              ))}
            </div>
          )}

          {/* Time input */}
          <div className="flex flex-col gap-content-gap-2-5">
            <label
              htmlFor="edit-time"
              className="text-sm font-medium text-text-heading"
            >
              Time
            </label>
            <Input
              id="edit-time"
              type="text"
              variant={timeValid ? "default" : "error"}
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              className="font-mono"
              placeholder="00:00:00"
            />
          </div>

          {/* Current ads */}
          <div className="flex flex-col gap-content-gap-2-5">
            <span className="text-sm font-medium text-text-heading">
              Assigned ad{adIds.length !== 1 ? "s" : ""}
            </span>
            {selectedAds.length === 0 ? (
              <p className="text-sm text-text-muted">No ads assigned</p>
            ) : (
              <div className="flex flex-col gap-content-gap-xs">
                {selectedAds.map((ad) => (
                  <div
                    key={ad.id}
                    className="flex items-center gap-content-gap-md rounded-dialog border border-border-default p-3"
                  >
                    <div className="h-10 w-16 shrink-0 overflow-hidden rounded-button-primary bg-video-bg">
                      <video
                        src={ad.videoUrl}
                        className="h-full w-full object-cover"
                        preload="metadata"
                        muted
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-semibold text-text-heading">
                        {ad.title}
                      </span>
                      <span className="text-xs text-text-muted">
                        {formatDurationShort(ad.duration)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {marker.type !== "AUTO" && (
              <Button
                variant="outline"
                className="mt-1"
                onClick={() => setStep(DIALOG_STEPS.ADS)}
              >
                Change ad{marker.type === "AB" ? "s" : ""}
              </Button>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-content-gap-sm">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant={canSave ? "primary" : "disabled"}
              className="flex-1"
              onClick={handleSave}
              disabled={!canSave}
            >
              Save changes
            </Button>
          </div>
        </div>
      )}

      {step === DIALOG_STEPS.ADS && (
        <AdPickerStep
          mode={marker.type === "STATIC" ? "single" : "multi"}
          onConfirm={handleAdsConfirm}
          onBack={() => setStep(DIALOG_STEPS.DETAILS)}
          initialSelectedIds={adIds}
        />
      )}
    </Dialog>
  );
}
