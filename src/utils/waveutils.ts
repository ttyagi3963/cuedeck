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
  | {
      kind: "episode";
      startPct: number;
      widthPct: number;
      // Episode-time range this visual segment represents. Distinct from
      // visual cursor so the playhead can map episode time to visual
      // position segment-by-segment (episode time "skips" past ad tiles).
      episodeStartSec: number;
      episodeEndSec: number;
    }
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
    return [
      {
        kind: "episode",
        startPct: 0,
        widthPct: 100,
        episodeStartSec: 0,
        episodeEndSec: duration,
      },
    ];
  }

  const segments: Segment[] = [];
  let cursor = 0;
  let episodeResumeSec = 0;

  for (const marker of sorted) {
    const markerStart = marker.timeSec;
    const adDuration = getMarkerDisplayDuration(marker);

    // Episode segment before this ad
    if (markerStart > cursor) {
      const startPct = (cursor / duration) * 100;
      const widthPct = ((markerStart - cursor) / duration) * 100;
      segments.push({
        kind: "episode",
        startPct,
        widthPct,
        episodeStartSec: episodeResumeSec,
        episodeEndSec: markerStart,
      });
    }

    // Ad segment
    const startPct = (markerStart / duration) * 100;
    const widthPct = (adDuration / duration) * 100;
    segments.push({ kind: "ad", startPct, widthPct, marker });

    cursor = markerStart + adDuration;
    // Episode playback resumes from marker.timeSec after the ad, so the
    // next episode segment's episode-time range starts there — not from
    // `cursor`, which is in insertion-space.
    episodeResumeSec = markerStart;
  }

  // Trailing episode segment
  if (cursor < duration) {
    const startPct = (cursor / duration) * 100;
    const widthPct = ((duration - cursor) / duration) * 100;
    segments.push({
      kind: "episode",
      startPct,
      widthPct,
      episodeStartSec: episodeResumeSec,
      episodeEndSec: duration,
    });
  }

  return segments;
}

/**
 * Map an episode playback time to a visual timeline percentage, respecting
 * ad-tile "breaks". Within each episode segment the mapping is linear across
 * that segment's episode-time range; at the moment episode time crosses a
 * marker boundary, the visual cursor jumps past the ad tile (Option 1 per
 * reviewer spec — cursor is never visually inside an ad tile while episode
 * content is playing).
 */
export function cursorPctFromEpisodeTime(
  episodeTime: number,
  segments: readonly Segment[],
): number {
  for (const seg of segments) {
    if (seg.kind !== "episode") continue;
    if (episodeTime <= seg.episodeEndSec) {
      const range = seg.episodeEndSec - seg.episodeStartSec;
      const local =
        range > 0
          ? Math.max(0, Math.min(1, (episodeTime - seg.episodeStartSec) / range))
          : 0;
      return seg.startPct + local * seg.widthPct;
    }
  }
  return 100;
}
