import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAdInjection } from "@/hooks/useAdInjection";
import type { Marker } from "@/contracts/marker";
import type { MarkerAd } from "@/contracts/ad";

function makeAd(id: string, duration = 30): MarkerAd {
  return {
    id: `ma-${id}`,
    markerId: "m1",
    adId: id,
    playCount: 0,
    ad: {
      id,
      title: `Ad ${id}`,
      videoUrl: `/ads/${id}.mp4`,
      duration,
      createdAt: new Date(),
    },
  };
}

function makeMarker(
  id: string,
  timeSec: number,
  type: Marker["type"],
  ads: MarkerAd[],
): Marker {
  return {
    id,
    episodeId: "ep1",
    timeSec,
    type,
    label: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    markerAds: ads,
  };
}

describe("useAdInjection", () => {
  let pause: ReturnType<typeof vi.fn<() => void>>;
  let resume: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    pause = vi.fn<() => void>();
    resume = vi.fn<() => void>();
  });

  it("starts with no ad playing", () => {
    const markers = [makeMarker("m1", 10, "STATIC", [makeAd("a1")])];
    const { result } = renderHook(() => useAdInjection(markers, pause, resume));

    expect(result.current.state.isPlayingAd).toBe(false);
    expect(result.current.state.currentAd).toBeNull();
  });

  it("triggers ad when playback passes marker time (STATIC)", () => {
    const ad = makeAd("a1");
    const markers = [makeMarker("m1", 10, "STATIC", [ad])];
    const { result } = renderHook(() => useAdInjection(markers, pause, resume));

    act(() => result.current.check(10));

    expect(result.current.state.isPlayingAd).toBe(true);
    expect(result.current.state.currentAd?.id).toBe("a1");
    expect(pause).toHaveBeenCalled();
  });

  it("resumes playback when ad ends", () => {
    const markers = [makeMarker("m1", 10, "STATIC", [makeAd("a1")])];
    const { result } = renderHook(() => useAdInjection(markers, pause, resume));

    act(() => result.current.check(10));
    act(() => result.current.onAdEnded());

    expect(result.current.state.isPlayingAd).toBe(false);
    expect(result.current.state.currentAd).toBeNull();
    expect(resume).toHaveBeenCalled();
  });

  it("does not trigger same marker twice", () => {
    const markers = [makeMarker("m1", 10, "STATIC", [makeAd("a1")])];
    const { result } = renderHook(() => useAdInjection(markers, pause, resume));

    act(() => result.current.check(10));
    act(() => result.current.onAdEnded());

    act(() => result.current.check(11));

    expect(result.current.state.isPlayingAd).toBe(false);
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it("skips marker with no ads without pausing", () => {
    const markers = [makeMarker("m1", 5, "STATIC", [])];
    const { result } = renderHook(() => useAdInjection(markers, pause, resume));

    act(() => result.current.check(5));

    expect(result.current.state.isPlayingAd).toBe(false);
    expect(pause).not.toHaveBeenCalled();
  });

  it("reset re-enables markers before seek time", () => {
    const markers = [
      makeMarker("m1", 5, "STATIC", [makeAd("a1")]),
      makeMarker("m2", 15, "STATIC", [makeAd("a2")]),
    ];
    const { result } = renderHook(() => useAdInjection(markers, pause, resume));

    // Play past both markers
    act(() => result.current.check(5));
    act(() => result.current.onAdEnded());
    act(() => result.current.check(15));
    act(() => result.current.onAdEnded());

    // Seek back to 10 — m1 should stay played, m2 should replay
    act(() => result.current.reset(10));
    act(() => result.current.check(15));

    expect(result.current.state.isPlayingAd).toBe(true);
    expect(result.current.state.currentAd?.id).toBe("a2");
  });

  it("AB type picks randomly among ads with equal play count", () => {
    const markers = [makeMarker("m1", 10, "AB", [makeAd("a1"), makeAd("a2")])];
    const { result } = renderHook(() => useAdInjection(markers, pause, resume));

    act(() => result.current.check(10));

    // Should pick one of the two ads (both start at 0 play count)
    expect(["a1", "a2"]).toContain(result.current.state.currentAd?.id);
  });

  it("AB type rotates after play count increments", () => {
    const ad1 = makeAd("a1");
    const ad2 = makeAd("a2");
    const markers = [makeMarker("m1", 10, "AB", [ad1, ad2])];
    const { result } = renderHook(() => useAdInjection(markers, pause, resume));

    // First play — both at count 0, picks randomly
    act(() => result.current.check(10));
    const firstAdId = result.current.state.currentAd?.id;
    expect(firstAdId).toBeDefined();
    act(() => result.current.onAdEnded());

    // Seek back so marker replays
    act(() => result.current.reset(0));
    act(() => result.current.check(10));

    // After first ad played, its count is 1 while the other is 0
    // So the second play must pick the other ad
    const secondAdId = result.current.state.currentAd?.id;
    expect(secondAdId).not.toBe(firstAdId);
  });
});
