"use client";

import { useState, useMemo } from "react";
import type { Ad } from "@/contracts/ad";
import { useAds } from "@/hooks/useAds";
import Button from "@/app/_components/ui/Button";
import Input from "@/app/_components/ui/Input";
import Spinner from "@/app/_components/ui/Spinner";

type AdPickerStepProps = {
  mode: "single" | "multi";
  onConfirm: (adIds: string[]) => void;
  onBack: () => void;
  initialSelectedIds?: string[];
};

export default function AdPickerStep({
  mode,
  onConfirm,
  onBack,
  initialSelectedIds = [],
}: AdPickerStepProps) {
  const { data: ads = [], isLoading } = useAds();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialSelectedIds),
  );
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      ads.filter((ad) => ad.title.toLowerCase().includes(search.toLowerCase())),
    [ads, search],
  );

  function toggleAd(ad: Ad) {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (mode === "single") {
        if (next.has(ad.id)) {
          next.delete(ad.id);
        } else {
          next.clear();
          next.add(ad.id);
        }
      } else {
        if (next.has(ad.id)) {
          next.delete(ad.id);
        } else {
          next.add(ad.id);
        }
      }

      return next;
    });
  }

  function handleConfirm() {
    onConfirm(Array.from(selectedIds));
  }

  const confirmLabel = mode === "single" ? "Assign ad" : `Create A/B test`;

  const selectionCount = selectedIds.size;
  const canConfirm =
    mode === "single" ? selectionCount === 1 : selectionCount >= 2;

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <Input
        type="text"
        placeholder="Search ads..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Ad list */}
      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-text-muted">
            No ads found
          </p>
        )}
        {filtered.map((ad) => {
          const isSelected = selectedIds.has(ad.id);

          return (
            <button
              key={ad.id}
              type="button"
              onClick={() => toggleAd(ad)}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                isSelected
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-border-default hover:border-border-subtle"
              }`}
            >
              {/* Thumbnail */}
              <div className="h-14 w-24 shrink-0 overflow-hidden rounded-md bg-black">
                <video
                  src={ad.videoUrl}
                  className="h-full w-full object-cover"
                  preload="metadata"
                  muted
                />
              </div>

              {/* Info */}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold text-text-heading">
                  {ad.title}
                </span>
                <span className="text-xs text-text-muted">
                  {Math.floor(ad.duration / 60)}m {Math.floor(ad.duration % 60)}
                  s
                </span>
              </div>

              {/* Checkbox / Radio indicator */}
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 ${
                  mode === "single" ? "rounded-full" : "rounded-md"
                } ${isSelected ? "border-zinc-900" : "border-border-default"}`}
              >
                {isSelected &&
                  (mode === "single" ? (
                    <div className="h-2.5 w-2.5 rounded-full bg-zinc-900" />
                  ) : (
                    <div className="h-3 w-3 rounded-sm bg-zinc-900" />
                  ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2">
        {selectionCount > 0 && (
          <p className="text-center text-xs text-text-muted">
            {selectionCount} ad{selectionCount !== 1 ? "s" : ""} selected
            {mode === "multi" && selectionCount < 2 && (
              <span className="ml-1 text-red-400">(min 2)</span>
            )}
          </p>
        )}
        <div className="flex gap-content-gap-sm">
          <Button variant="outline" className="flex-1" onClick={onBack}>
            Back
          </Button>
          <Button
            variant={canConfirm ? "primary" : "disabled"}
            className="flex-1"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
