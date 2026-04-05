import type { ComponentType } from "react";
import { MarkerAuto, MarkerStatic, MarkerAB } from "@/app/_components/ui/icons";

export const MARKER_TYPES = ["STATIC", "AUTO", "AB"] as const;

export type MarkerType = (typeof MARKER_TYPES)[number];

export const MARKER_TYPE_META: Record<
  MarkerType,
  { label: string; shortLabel: string; description: string; badgeClass: string }
> = {
  AUTO: {
    label: "Auto",
    shortLabel: "Auto",
    description: "Automatic ad insertions",
    badgeClass: "bg-badge-auto-bg text-badge-auto-text",
  },
  STATIC: {
    label: "Static",
    shortLabel: "Static",
    description: "A marker for a specific ad that you select",
    badgeClass: "bg-badge-static-bg text-badge-static-text",
  },
  AB: {
    label: "A/B test",
    shortLabel: "A/B",
    description: "Compare the performance of multiple ads",
    badgeClass: "bg-badge-ab-bg text-badge-ab-text",
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
}
