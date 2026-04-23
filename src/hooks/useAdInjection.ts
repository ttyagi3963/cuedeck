"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import type { Marker } from "@/contracts/marker";
import type { Ad } from "@/contracts/ad";

export interface AdInjectionState {
  isPlayingAd: boolean;
  currentAd: Ad | null;
  // Seconds of the current ad that have played. Used by the waveform
  // playhead to animate the cursor smoothly through the ad tile while the
  // ad is playing, and to freeze it correctly if the ad video is paused.
  adElapsedSec: number;
  // Whether the ad <video> is currently paused. Drives the toolbar
  // play/pause icon so it reflects the state of what's actually visible
  // on screen (the ad) rather than the frozen main <video> underneath.
  isAdPaused: boolean;
}

export interface AdInjectionControls {
  state: AdInjectionState;

  check: (currentTime: number) => void;

  onAdEnded: () => void;

  onAdTimeUpdate: (currentTime: number) => void;

  onAdPlay: () => void;

  onAdPause: () => void;

  reset: (seekTime: number) => void;

  markAsPlayed: (markerId: string) => void;

  suppress: () => void;

  unsuppress: () => void;

  // Registers the AdOverlay's <video> element so the editor can drive
  // play/pause of the ad video from the top-level toggle button, spacebar
  // shortcut, or a click on the ad overlay itself.
  setAdVideo: (el: HTMLVideoElement | null) => void;

  togglePlayPauseAd: () => void;

  pauseAd: () => void;

  playAd: () => void;
}

function resolveAd(
  marker: Marker,
  abPlayCounts: Map<string, number>,
): Ad | null {
  const ads = marker.markerAds;
  if (!ads || ads.length === 0) return null;

  switch (marker.type) {
    case "STATIC":
      return ads[0].ad;

    case "AUTO":
      return ads[Math.floor(Math.random() * ads.length)].ad;

    case "AB": {
      const withCounts = ads.map((ma) => ({
        markerAd: ma,
        count: abPlayCounts.get(ma.id) ?? 0,
      }));
      const minCount = Math.min(...withCounts.map((w) => w.count));
      const tied = withCounts.filter((w) => w.count === minCount);
      const pick = tied[Math.floor(Math.random() * tied.length)];
      return pick.markerAd.ad;
    }
  }
}

export function useAdInjection(
  markers: Marker[],
  pause: () => void,
  resume: () => void,
): AdInjectionControls {
  const [adState, setAdState] = useState<AdInjectionState>({
    isPlayingAd: false,
    currentAd: null,
    adElapsedSec: 0,
    isAdPaused: false,
  });

  const [playedMarkerIds, setPlayedMarkerIds] = useState<Set<string>>(
    () => new Set(),
  );
  const resumeRef = useRef<(() => void) | null>(null);
  const suppressedRef = useRef(false);
  const suppressEndTimeRef = useRef(0);
  const currentMarkerAdIdRef = useRef<string | null>(null);
  const adVideoRef = useRef<HTMLVideoElement | null>(null);
  const [abPlayCounts, setAbPlayCounts] = useState<Map<string, number>>(
    () => new Map(),
  );

  const activeMarkerIds = useMemo(
    () => new Set(markers.map((marker) => marker.id)),
    [markers],
  );
  const syncedPlayedMarkerIds = useMemo(() => {
    const next = new Set<string>();

    for (const markerId of playedMarkerIds) {
      if (activeMarkerIds.has(markerId)) {
        next.add(markerId);
      }
    }

    return next;
  }, [activeMarkerIds, playedMarkerIds]);

  const addPlayedMarkerId = useCallback((markerId: string) => {
    setPlayedMarkerIds((prev) => {
      if (prev.has(markerId)) {
        return prev;
      }

      const next = new Set(prev);
      next.add(markerId);
      return next;
    });
  }, []);

  const check = useCallback(
    (currentTime: number) => {
      if (adState.isPlayingAd) return;

      if (suppressedRef.current) {
        if (Date.now() < suppressEndTimeRef.current) return;
        suppressedRef.current = false;
      }

      for (const marker of markers) {
        if (
          currentTime >= marker.timeSec &&
          !syncedPlayedMarkerIds.has(marker.id)
        ) {
          const ad = resolveAd(marker, abPlayCounts);
          if (!ad) {
            addPlayedMarkerId(marker.id);
            continue;
          }

          const matchedMarkerAd = marker.markerAds.find(
            (ma) => ma.ad.id === ad.id,
          );
          currentMarkerAdIdRef.current = matchedMarkerAd?.id ?? null;

          addPlayedMarkerId(marker.id);
          pause();
          resumeRef.current = resume;
          setAdState({
            isPlayingAd: true,
            currentAd: ad,
            adElapsedSec: 0,
            isAdPaused: false,
          });
          return;
        }
      }
    },
    [
      markers,
      pause,
      resume,
      adState.isPlayingAd,
      syncedPlayedMarkerIds,
      addPlayedMarkerId,
      abPlayCounts,
    ],
  );

  // Called from AdOverlay's <video onTimeUpdate>. Cheap enough to live in
  // state — drives the playhead cursor through the ad tile in real time.
  const onAdTimeUpdate = useCallback((currentTime: number) => {
    setAdState((prev) => {
      if (!prev.isPlayingAd) return prev;
      if (prev.adElapsedSec === currentTime) return prev;
      return { ...prev, adElapsedSec: currentTime };
    });
  }, []);

  const onAdPlay = useCallback(() => {
    setAdState((prev) => {
      if (!prev.isPlayingAd) return prev;
      if (!prev.isAdPaused) return prev;
      return { ...prev, isAdPaused: false };
    });
  }, []);

  const onAdPause = useCallback(() => {
    setAdState((prev) => {
      if (!prev.isPlayingAd) return prev;
      if (prev.isAdPaused) return prev;
      return { ...prev, isAdPaused: true };
    });
  }, []);

  const onAdEnded = useCallback(() => {
    const markerAdId = currentMarkerAdIdRef.current;
    if (markerAdId) {
      setAbPlayCounts((prev) => {
        const next = new Map(prev);
        next.set(markerAdId, (prev.get(markerAdId) ?? 0) + 1);
        return next;
      });
      currentMarkerAdIdRef.current = null;
    }

    setAdState({
      isPlayingAd: false,
      currentAd: null,
      adElapsedSec: 0,
      isAdPaused: false,
    });
    resumeRef.current?.();
    resumeRef.current = null;
  }, []);

  const reset = useCallback(
    (seekTime: number) => {
      setPlayedMarkerIds(() => {
        const keep = new Set<string>();
        for (const marker of markers) {
          if (marker.timeSec < seekTime) {
            keep.add(marker.id);
          }
        }
        return keep;
      });

      setAdState({
      isPlayingAd: false,
      currentAd: null,
      adElapsedSec: 0,
      isAdPaused: false,
    });
      resumeRef.current = null;
      currentMarkerAdIdRef.current = null;
    },
    [markers],
  );

  const markAsPlayed = useCallback(
    (markerId: string) => {
      addPlayedMarkerId(markerId);
    },
    [addPlayedMarkerId],
  );

  const suppress = useCallback(() => {
    suppressedRef.current = true;
  }, []);

  const unsuppress = useCallback(() => {
    suppressEndTimeRef.current = Date.now() + 1500;
  }, []);

  const setAdVideo = useCallback((el: HTMLVideoElement | null) => {
    adVideoRef.current = el;
  }, []);

  const pauseAd = useCallback(() => {
    const el = adVideoRef.current;
    if (el && !el.paused) {
      el.pause();
    }
  }, []);

  const playAd = useCallback(() => {
    const el = adVideoRef.current;
    if (el && el.paused) {
      void el.play();
    }
  }, []);

  const togglePlayPauseAd = useCallback(() => {
    const el = adVideoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
    } else {
      el.pause();
    }
  }, []);

  return {
    state: adState,
    check,
    onAdEnded,
    onAdTimeUpdate,
    onAdPlay,
    onAdPause,
    reset,
    markAsPlayed,
    suppress,
    unsuppress,
    setAdVideo,
    togglePlayPauseAd,
    pauseAd,
    playAd,
  };
}
