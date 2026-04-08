"use client";

import { useState, useMemo, useCallback } from "react";
import type { Ad } from "@/contracts/ad";
import { useAds } from "@/hooks/useAds";
import { formatDurationShort } from "@/utils/time";
import Button from "@/app/_components/ui/Button";
import SearchInput from "@/app/_components/ui/SearchInput";
import Spinner from "@/app/_components/ui/Spinner";

type AdPickerStepProps = {
  mode: "single" | "multi";
  onConfirm: (adIds: string[]) => void;
  onBack: () => void;
  initialSelectedIds?: string[];
};

const UNNAMED_COMPANY = "Unnamed";
const ALL_ADS_CATEGORY = "All Ads";

function groupAdsByCompany(ads: Ad[]): Map<string, Ad[]> {
  const groups = new Map<string, Ad[]>();
  for (const ad of ads) {
    const company = ad.companyName?.trim() || UNNAMED_COMPANY;
    const list = groups.get(company);
    if (list) {
      list.push(ad);
    } else {
      groups.set(company, [ad]);
    }
  }
  return groups;
}

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
  const handleSearch = useCallback((query: string) => setSearch(query), []);

  const grouped = useMemo(() => groupAdsByCompany(ads), [ads]);
  const companies = useMemo(() => Array.from(grouped.keys()), [grouped]);
  const libraryCategories = useMemo(
    () => [ALL_ADS_CATEGORY, ...companies],
    [companies],
  );

  const [activeCompany, setActiveCompany] = useState<string>(ALL_ADS_CATEGORY);

  const resolvedCompany = libraryCategories.includes(activeCompany)
    ? activeCompany
    : ALL_ADS_CATEGORY;

  const companyAds = useMemo(() => {
    const all =
      resolvedCompany === ALL_ADS_CATEGORY
        ? ads
        : (grouped.get(resolvedCompany) ?? []);
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter((ad) => {
      const titleMatches = ad.title.toLowerCase().includes(q);
      const companyMatches = (ad.companyName ?? "").toLowerCase().includes(q);
      return titleMatches || companyMatches;
    });
  }, [ads, grouped, resolvedCompany, search]);

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

  const confirmLabel = mode === "single" ? "Assign ad" : "Create A/B test";
  const selectionCount = selectedIds.size;
  const canConfirm =
    mode === "single" ? selectionCount === 1 : selectionCount >= 2;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-content-gap-sm">
      <div className="flex gap-content-gap-sm" style={{ minHeight: 340 }}>
        {/* Left sidebar — company list */}
        <div className="flex w-44 shrink-0 flex-col gap-content-gap-xs border-r border-border-default pr-4">
          <SearchInput
            placeholder="Search library..."
            onSearch={handleSearch}
          />
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Ad library
          </p>
          <nav className="flex flex-col gap-0.5 overflow-y-auto">
            {libraryCategories.map((company) => {
              const isActive = company === resolvedCompany;
              return (
                <button
                  key={company}
                  type="button"
                  onClick={() => setActiveCompany(company)}
                  className={`rounded-button-primary px-2 py-1.5 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-background-hover font-semibold text-text-heading"
                      : "text-text-muted hover:bg-background-page hover:text-text-heading"
                  }`}
                >
                  {company}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right panel — ad cards */}
        <div className="flex min-w-0 flex-1 flex-col gap-content-gap-xs overflow-y-auto">
          {companyAds.length === 0 && (
            <p className="py-8 text-center text-sm text-text-muted">
              No ads found
            </p>
          )}
          {companyAds.map((ad) => {
            const isSelected = selectedIds.has(ad.id);

            return (
              <button
                key={ad.id}
                type="button"
                onClick={() => toggleAd(ad)}
                className={`flex items-center gap-content-gap-md rounded-dialog border p-3 text-left transition-colors ${
                  isSelected
                    ? "border-border-active bg-background-page"
                    : "border-border-default hover:border-border-subtle"
                }`}
              >
                {/* Thumbnail */}
                <div className="h-14 w-24 shrink-0 overflow-hidden rounded-button-primary bg-video-bg">
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
                    {formatDurationShort(ad.duration)}
                    {ad.companyName && (
                      <>
                        {" · "}
                        {ad.companyName}
                      </>
                    )}
                  </span>
                </div>

                {/* Checkbox / Radio indicator */}
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 ${
                    mode === "single" ? "rounded-full" : "rounded-button-primary"
                  } ${isSelected ? "border-border-active" : "border-border-default"}`}
                >
                  {isSelected &&
                    (mode === "single" ? (
                      <div className="h-2.5 w-2.5 rounded-full bg-background-primary" />
                    ) : (
                      <div className="h-3 w-3 rounded-sm bg-background-primary" />
                    ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-content-gap-xs">
        {selectionCount > 0 && (
          <p className="text-center text-xs text-text-muted">
            {selectionCount} ad{selectionCount !== 1 ? "s" : ""} selected
            {mode === "multi" && selectionCount < 2 && (
              <span className="ml-1 text-text-danger-subtle">(min 2)</span>
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
