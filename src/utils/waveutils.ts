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

export function getMarkerDisplayDuration(marker: Marker): number {
  const durations = marker.markerAds.map((markerAd) => markerAd.ad.duration);
  if (durations.length === 0) return 0;

  if (marker.type === "STATIC") {
    return durations[0] ?? 0;
  }

  return Math.max(...durations);
}
