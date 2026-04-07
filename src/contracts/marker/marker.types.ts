import type { MarkerAd } from "@/contracts/ad";

export const MARKER_TYPES = ["STATIC", "AUTO", "AB"] as const;

export type MarkerType = (typeof MARKER_TYPES)[number];

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
