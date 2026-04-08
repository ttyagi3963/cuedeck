import { describe, it, expect } from "vitest";
import {
  clampZoom,
  getTickInterval,
  generateTicks,
  getMarkerDisplayDuration,
} from "@/utils/waveutils";
import type { Marker } from "@/contracts/marker";
import type { MarkerAd } from "@/contracts/ad";

function makeAd(duration: number): MarkerAd {
  return {
    id: `ma-${duration}`,
    markerId: "m1",
    adId: `a-${duration}`,
    playCount: 0,
    ad: {
      id: `a-${duration}`,
      title: `Ad ${duration}s`,
      videoUrl: "/test.mp4",
      duration,
      createdAt: new Date(),
    },
  };
}

function makeMarker(type: Marker["type"], ads: MarkerAd[]): Marker {
  return {
    id: "m1",
    episodeId: "ep1",
    timeSec: 10,
    type,
    label: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    markerAds: ads,
  };
}

describe("clampZoom", () => {
  it("clamps below min to 0", () => {
    expect(clampZoom(-50)).toBe(0);
  });

  it("clamps above max to 100", () => {
    expect(clampZoom(999)).toBe(100);
  });

  it("passes through a valid value", () => {
    expect(clampZoom(50)).toBe(50);
  });

  it("returns 0 for exactly 0", () => {
    expect(clampZoom(0)).toBe(0);
  });

  it("returns 100 for exactly 100", () => {
    expect(clampZoom(100)).toBe(100);
  });
});

describe("getTickInterval", () => {
  it("returns 10 for short durations (≤60s)", () => {
    expect(getTickInterval(30)).toBe(10);
    expect(getTickInterval(60)).toBe(10);
  });

  it("returns 30 for medium durations (61–300s)", () => {
    expect(getTickInterval(120)).toBe(30);
    expect(getTickInterval(300)).toBe(30);
  });

  it("returns 60 for long durations (301–900s)", () => {
    expect(getTickInterval(600)).toBe(60);
    expect(getTickInterval(900)).toBe(60);
  });

  it("returns 120 for very long durations (>900s)", () => {
    expect(getTickInterval(1800)).toBe(120);
  });
});

describe("generateTicks", () => {
  it("generates ticks from 0 to duration", () => {
    const ticks = generateTicks(30);
    expect(ticks).toEqual([0, 10, 20, 30]);
  });

  it("returns [0] for 0 duration", () => {
    expect(generateTicks(0)).toEqual([0]);
  });

  it("does not exceed duration", () => {
    const ticks = generateTicks(25);
    expect(ticks).toEqual([0, 10, 20]);
  });
});

describe("getMarkerDisplayDuration", () => {
  it("returns 0 when marker has no ads", () => {
    const marker = makeMarker("STATIC", []);
    expect(getMarkerDisplayDuration(marker)).toBe(0);
  });

  it("returns first ad duration for STATIC type", () => {
    const marker = makeMarker("STATIC", [makeAd(30), makeAd(60)]);
    expect(getMarkerDisplayDuration(marker)).toBe(30);
  });

  it("returns max ad duration for AUTO type", () => {
    const marker = makeMarker("AUTO", [makeAd(15), makeAd(45)]);
    expect(getMarkerDisplayDuration(marker)).toBe(45);
  });

  it("returns max ad duration for AB type", () => {
    const marker = makeMarker("AB", [makeAd(10), makeAd(20), makeAd(5)]);
    expect(getMarkerDisplayDuration(marker)).toBe(20);
  });
});
