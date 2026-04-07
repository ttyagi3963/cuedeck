import type { ComponentType } from "react";
import type { MarkerAd } from "@/contracts/ad";
import { MarkerAuto, MarkerStatic, MarkerAB } from "@/app/_components/ui/icons";

export const MARKER_TYPES = ["STATIC", "AUTO", "AB"] as const;

export type MarkerType = (typeof MARKER_TYPES)[number];

export const MARKER_TYPE_META: Record<
  MarkerType,
  {
    label: string;
    shortLabel: string;
    description: string;
    badgeClass: string;
    waveformLineClass: string;
    waveformRegionClass: string;
  }
> = {
  AUTO: {
    label: "Auto",
    shortLabel: "Auto",
    description: "Automatic ad insertions",
    badgeClass: "bg-badge-auto-bg text-badge-auto-text",
    waveformLineClass: "bg-badge-auto-text",
    waveformRegionClass: "bg-badge-auto-bg",
  },
  STATIC: {
    label: "Static",
    shortLabel: "Static",
    description: "A marker for a specific ad that you select",
    badgeClass: "bg-badge-static-bg text-badge-static-text",
    waveformLineClass: "bg-badge-static-text",
    waveformRegionClass: "bg-badge-static-bg",
  },
  AB: {
    label: "A/B test",
    shortLabel: "A/B",
    description: "Compare the performance of multiple ads",
    badgeClass: "bg-badge-ab-bg text-badge-ab-text",
    waveformLineClass: "bg-badge-ab-text",
    waveformRegionClass: "bg-badge-ab-bg",
  },
};

export const MARKER_TYPE_ICONS: Record<MarkerType, ComponentType> = {
  AUTO: MarkerAuto,
  STATIC: MarkerStatic,
  AB: MarkerAB,
};

export interface Marker {
  id: string;
  episodeId: string;
  timeSec: number;
  type: MarkerType;
  label: string | null;
  createdAt: Date;
  updatedAt: Date;
  markerAds: MarkerAd[];
}
