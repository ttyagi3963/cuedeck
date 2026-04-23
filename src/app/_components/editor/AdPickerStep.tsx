"use client";

import { useState, useMemo, useCallback } from "react";
import type { Ad } from "@/contracts/ad";
import { useAds } from "@/hooks/useAds";
import { formatDurationShort, formatShortDate } from "@/utils/time";
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
const ALL_ADS_CATEGORY = "All folders";

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
      } else if (next.has(ad.id)) {
        next.delete(ad.id);
      } else {
        next.add(ad.id);
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
    <div className="flex flex-col gap-content-gap-md">
      <div className="flex gap-content-gap-md" style={{ minHeight: 420 }}>
        {/* Left sidebar: tinted gray panel containing search + folder list.
            Target design uses a distinct bg tint (not just a border) to set
            the sidebar apart from the main content area. */}
        <div className="flex w-56 shrink-0 flex-col gap-content-gap-sm rounded-dialog bg-background-page p-4">
          <SearchInput
            placeholder="Search library..."
            onSearch={handleSearch}
          />
          <div className="flex items-center gap-2 px-2 pt-2">
            {/* Small "library / stacks" icon matching the target's visual
                language for the heading. */}
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className="h-4 w-4 shrink-0 text-text-heading"
              aria-hidden="true"
            >
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-sm font-semibold text-text-heading">
              Ad library
            </span>
          </div>
          <nav className="flex flex-col gap-0.5 overflow-y-auto">
            {libraryCategories.map((company) => {
              const isActive = company === resolvedCompany;
              const isAllFolders = company === ALL_ADS_CATEGORY;
              return (
                <button
                  key={company}
                  type="button"
                  onClick={() => setActiveCompany(company)}
                  // Dark text for every row, weight-only distinction for
                  // active. Chevrons match the row color.
                  className={`flex items-center justify-between px-2 py-2 text-left text-sm text-text-heading transition-colors ${
                    isActive ? "font-semibold" : "font-normal"
                  }`}
                >
                  <span className="truncate">{company}</span>
                  {!isAllFolders && (
                    // Decorative right-chevron — sub-folders aren't a data
                    // concept yet, so it's static. Target shows up/down
                    // chevrons for expandable folders; we only collapse.
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    >
                      <path
                        d="M7.5 5L12.5 10L7.5 15"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main ad list */}
        <div className="flex min-w-0 flex-1 flex-col gap-content-gap-sm overflow-y-auto">
          {/* Top toolbar: sort selector + search-ads input. The sort is
              visual-only for now (no sort state plumbing); the search
              filters the same `search` state as the library search. */}
          <div className="flex items-center gap-content-gap-sm pb-1">
            <button
              type="button"
              className="flex items-center gap-2 rounded-button-primary border border-border-default bg-surface px-3 py-2 text-sm font-medium text-text-heading"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path
                  d="M10 4v12M6 8l4-4 4 4M6 12l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Upload date</span>
            </button>
            <div className="flex-1">
              <SearchInput
                placeholder="Search ads..."
                onSearch={handleSearch}
              />
            </div>
          </div>
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
                {/* Larger 16:10 thumbnail */}
                <div className="h-14 w-24 shrink-0 overflow-hidden rounded-button-primary bg-video-bg">
                  <video
                    src={ad.videoUrl}
                    className="h-full w-full object-cover"
                    preload="metadata"
                    muted
                  />
                </div>

                {/* Title + meta row + tag pill */}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-sm font-semibold text-text-heading">
                    {ad.title}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-text-muted">
                    <span>{formatShortDate(ad.createdAt)}</span>
                    <span aria-hidden="true">•</span>
                    <span>{formatDurationShort(ad.duration)}</span>
                  </span>
                  {ad.companyName && (
                    <span className="mt-0.5 flex flex-wrap gap-1">
                      <span className="inline-flex items-center rounded-full bg-background-page px-2 py-0.5 text-[11px] font-medium text-text-heading">
                        {ad.companyName}
                      </span>
                    </span>
                  )}
                </div>

                {/* Checkbox on the right */}
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

      {/* Footer: Cancel on the left, selection counter + Create button on the right */}
      <div className="flex items-center justify-between gap-content-gap-sm border-t border-border-default pt-content-gap-sm">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <div className="flex items-center gap-content-gap-md">
          {selectionCount > 0 && (
            <p className="text-sm text-text-muted">
              {selectionCount} ad{selectionCount !== 1 ? "s" : ""} selected
              {mode === "multi" && selectionCount < 2 && (
                <span className="ml-1 text-text-danger-subtle">(min 2)</span>
              )}
            </p>
          )}
          <Button
            variant={canConfirm ? "primary" : "disabled"}
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
