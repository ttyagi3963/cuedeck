"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { Marker } from "@/contracts/marker";
import type { Ad } from "@/contracts/ad";

export interface AdInjectionState {
  isPlayingAd: boolean;
  currentAd: Ad | null;
}

export interface AdInjectionControls {
  state: AdInjectionState;

  check: (currentTime: number) => void;

  onAdEnded: () => void;

  reset: (seekTime: number) => void;

  markAsPlayed: (markerId: string) => void;

  suppress: () => void;

  unsuppress: (currentTime: number) => void;
}

function resolveAd(marker: Marker): Ad | null {
  const ads = marker.markerAds;
  if (!ads || ads.length === 0) return null;

  switch (marker.type) {
    case "STATIC":
      return ads[0].ad;

    case "AUTO":
      return ads[Math.floor(Math.random() * ads.length)].ad;

    case "AB": {
      const sorted = [...ads].sort((a, b) => a.playCount - b.playCount);
      return sorted[0].ad;
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
  });

  const playedMarkerIds = useRef(new Set<string>());
  const lockedMarkerIds = useRef(new Set<string>());
  const resumeRef = useRef<(() => void) | null>(null);
  const suppressedRef = useRef(false);
  const suppressEndTimeRef = useRef(0);

  const check = useCallback(
    (currentTime: number) => {
      if (adState.isPlayingAd) return;

      // Stay suppressed until cooldown expires, then mark all as played
      if (suppressedRef.current) {
        if (Date.now() < suppressEndTimeRef.current) return;
        suppressedRef.current = false;
        for (const marker of markers) {
          playedMarkerIds.current.add(marker.id);
        }
        return;
      }

      for (const marker of markers) {
        if (
          currentTime >= marker.timeSec &&
          !playedMarkerIds.current.has(marker.id)
        ) {
          const ad = resolveAd(marker);
          if (!ad) {
            playedMarkerIds.current.add(marker.id);
            continue;
          }

          playedMarkerIds.current.add(marker.id);
          pause();
          resumeRef.current = resume;
          setAdState({ isPlayingAd: true, currentAd: ad });
          return;
        }
      }
    },
    [markers, pause, resume, adState.isPlayingAd],
  );

  const onAdEnded = useCallback(() => {
    setAdState({ isPlayingAd: false, currentAd: null });
    resumeRef.current?.();
    resumeRef.current = null;
  }, []);

  const reset = useCallback(
    (seekTime: number) => {
      const keep = new Set<string>();
      for (const marker of markers) {
        if (marker.timeSec < seekTime) {
          keep.add(marker.id);
        }
      }
      playedMarkerIds.current = keep;
      lockedMarkerIds.current.clear();
      setAdState({ isPlayingAd: false, currentAd: null });
      resumeRef.current = null;
    },
    [markers],
  );

  const markAsPlayed = useCallback((markerId: string) => {
    playedMarkerIds.current.add(markerId);
    lockedMarkerIds.current.add(markerId);
  }, []);

  const suppress = useCallback(() => {
    suppressedRef.current = true;
  }, []);

  const unsuppress = useCallback((currentTime: number) => {
    suppressEndTimeRef.current = Date.now() + 1500;
  }, []);

  return {
    state: adState,
    check,
    onAdEnded,
    reset,
    markAsPlayed,
    suppress,
    unsuppress,
  };
}
