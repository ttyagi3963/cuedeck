"use client";

import { useRef, useState, useCallback, useMemo } from "react";
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

  unsuppress: () => void;
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

  const [playedMarkerIds, setPlayedMarkerIds] = useState<Set<string>>(
    () => new Set(),
  );
  const resumeRef = useRef<(() => void) | null>(null);
  const suppressedRef = useRef(false);
  const suppressEndTimeRef = useRef(0);

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

      // Stay suppressed until cooldown expires, then mark all as played
      if (suppressedRef.current) {
        if (Date.now() < suppressEndTimeRef.current) return;
        suppressedRef.current = false;
        setPlayedMarkerIds((prev) => {
          const next = new Set(prev);
          let changed = false;

          for (const marker of markers) {
            if (!next.has(marker.id)) {
              next.add(marker.id);
              changed = true;
            }
          }

          return changed ? next : prev;
        });
        return;
      }

      for (const marker of markers) {
        if (
          currentTime >= marker.timeSec &&
          !syncedPlayedMarkerIds.has(marker.id)
        ) {
          const ad = resolveAd(marker);
          if (!ad) {
            addPlayedMarkerId(marker.id);
            continue;
          }

          addPlayedMarkerId(marker.id);
          pause();
          resumeRef.current = resume;
          setAdState({ isPlayingAd: true, currentAd: ad });
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
    ],
  );

  const onAdEnded = useCallback(() => {
    setAdState({ isPlayingAd: false, currentAd: null });
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
      setAdState({ isPlayingAd: false, currentAd: null });
      resumeRef.current = null;
    },
    [markers],
  );

  const markAsPlayed = useCallback((markerId: string) => {
    addPlayedMarkerId(markerId);
  }, [addPlayedMarkerId]);

  const suppress = useCallback(() => {
    suppressedRef.current = true;
  }, []);

  const unsuppress = useCallback(() => {
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
