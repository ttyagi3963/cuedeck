"use client";

import { useState, useCallback } from "react";
import type { Marker } from "@/contracts/marker";
import { MARKER_TYPE_META } from "@/contracts/marker";
import { formatTimestamp } from "@/utils/time";
import Dialog from "@/app/_components/ui/Dialog";
import Button from "@/app/_components/ui/Button";
import Input from "@/app/_components/ui/Input";
import AdPickerStep from "./AdPickerStep";
import { useAds } from "@/hooks/useAds";

type Step = "details" | "ads";

type EditMarkerDialogProps = {
  marker: Marker;
  onClose: () => void;
  onConfirm: (markerId: string, timeSec: number, adIds: string[]) => void;
};

const TIME_REGEX = /^\d{2}:\d{2}:\d{2}$/;

/** Parse a strict HH:MM:SS string into seconds. Returns null if invalid. */
function parseTime(input: string): number | null {
  const trimmed = input.trim();
  if (!TIME_REGEX.test(trimmed)) return null;

  const [h, m, s] = trimmed.split(":").map(Number);
  if (h < 0 || m < 0 || m >= 60 || s < 0 || s >= 60) return null;
  return h * 3600 + m * 60 + s;
}

/** Returns true if the input matches HH:MM:SS with valid ranges. */
function isValidTime(input: string): boolean {
  return parseTime(input) !== null;
}

export default function EditMarkerDialog({
  marker,
  onClose,
  onConfirm,
}: EditMarkerDialogProps) {
  const [step, setStep] = useState<Step>("details");
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
    setStep("details");
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
    setStep("details");
  }

  const meta = MARKER_TYPE_META[marker.type];

  const title = step === "details" ? "Edit marker" : "Change ad";
  const subtitle =
    step === "details"
      ? `${meta.label} marker`
      : marker.type === "STATIC"
        ? "Select one ad for this marker"
        : "Select ads for A/B testing";

  return (
    <Dialog open onClose={handleClose} title={title} subtitle={subtitle}>
      {step === "details" && (
        <div className="flex flex-col gap-4">
          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2">
              {errors.map((err) => (
                <p key={err} className="text-xs font-medium text-red-400">
                  {err}
                </p>
              ))}
            </div>
          )}

          {/* Time input */}
          <div className="flex flex-col gap-1.5">
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
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-heading">
              Assigned ad{adIds.length !== 1 ? "s" : ""}
            </span>
            {selectedAds.length === 0 ? (
              <p className="text-sm text-text-muted">No ads assigned</p>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedAds.map((ad) => (
                  <div
                    key={ad.id}
                    className="flex items-center gap-3 rounded-lg border border-border-default p-3"
                  >
                    <div className="h-10 w-16 shrink-0 overflow-hidden rounded-md bg-black">
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
                        {Math.floor(ad.duration / 60)}m{" "}
                        {Math.floor(ad.duration % 60)}s
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
                onClick={() => setStep("ads")}
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

      {step === "ads" && (
        <AdPickerStep
          mode={marker.type === "STATIC" ? "single" : "multi"}
          onConfirm={handleAdsConfirm}
          onBack={() => setStep("details")}
          initialSelectedIds={adIds}
        />
      )}
    </Dialog>
  );
}
