import type { Marker } from "@/contracts/marker";
import { WAVE_MIN_PX_PER_SEC, WAVE_MAX_PX_PER_SEC } from "@/lib/constants";

export function clampZoom(value: number): number {
  return Math.min(Math.max(value, WAVE_MIN_PX_PER_SEC), WAVE_MAX_PX_PER_SEC);
}

export function getTickInterval(duration: number): number {
  if (duration <= 60) return 10;
  if (duration <= 300) return 30;
  if (duration <= 900) return 60;
  return 120;
}

export function generateTicks(duration: number): number[] {
  const interval = getTickInterval(duration);
  const ticks: number[] = [];

  for (let time = 0; time <= duration; time += interval) {
    ticks.push(time);
  }

  return ticks;
}

export function generateMiniTicks(duration: number): number[] {
  const interval = getTickInterval(duration);
  const miniInterval = interval / 5;
  const minis: number[] = [];
  const tickSet = new Set(generateTicks(duration));

  for (let time = 0; time <= duration; time += miniInterval) {
    const rounded = Math.round(time * 100) / 100;
    if (!tickSet.has(rounded)) {
      minis.push(rounded);
    }
  }

  return minis;
}

export function getMarkerDisplayDuration(marker: Marker): number {
  const durations = marker.markerAds.map((markerAd) => markerAd.ad.duration);
  if (durations.length === 0) return 0;

  if (marker.type === "STATIC") {
    return durations[0] ?? 0;
  }

  return Math.max(...durations);
}

export type Segment =
  | { kind: "episode"; startPct: number; widthPct: number }
  | { kind: "ad"; startPct: number; widthPct: number; marker: Marker };

export function computeSegments(
  markers: Marker[],
  duration: number,
): Segment[] {
  if (duration <= 0) return [];

  const sorted = [...markers]
    .filter((m) => m.markerAds.length > 0)
    .sort((a, b) => a.timeSec - b.timeSec);

  if (sorted.length === 0) {
    return [{ kind: "episode", startPct: 0, widthPct: 100 }];
  }

  const segments: Segment[] = [];
  let cursor = 0;

  for (const marker of sorted) {
    const markerStart = marker.timeSec;
    const adDuration = getMarkerDisplayDuration(marker);

    // Episode segment before this ad
    if (markerStart > cursor) {
      const startPct = (cursor / duration) * 100;
      const widthPct = ((markerStart - cursor) / duration) * 100;
      segments.push({ kind: "episode", startPct, widthPct });
    }

    // Ad segment
    const startPct = (markerStart / duration) * 100;
    const widthPct = (adDuration / duration) * 100;
    segments.push({ kind: "ad", startPct, widthPct, marker });

    cursor = markerStart + adDuration;
  }

  // Trailing episode segment
  if (cursor < duration) {
    const startPct = (cursor / duration) * 100;
    const widthPct = ((duration - cursor) / duration) * 100;
    segments.push({ kind: "episode", startPct, widthPct });
  }

  return segments;
}
