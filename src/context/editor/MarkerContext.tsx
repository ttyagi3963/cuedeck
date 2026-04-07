"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { Marker, MarkerType } from "@/contracts/marker";
import type { AdInjectionState } from "@/hooks/useAdInjection";
import { useAdInjection } from "@/hooks/useAdInjection";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useMarkers } from "@/hooks/useMarkers";
import {
  useCreateMarker,
  useDeleteMarker,
  useUpdateMarker,
} from "@/hooks/useMarkerMutations";
import { useToast } from "@/hooks/useToast";
import { useAds } from "@/hooks/useAds";
import {
  useEditorPlaybackControls,
  useEditorPlaybackCurrentTime,
  useEditorPlaybackDuration,
} from "./PlaybackContext";

function formatAutoTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type MarkerSnapshot = {
  timeSec: number;
  type: MarkerType;
  adIds: string[];
};

type MarkerCommandTarget = {
  currentId: string;
};

function getMarkerSnapshot(marker: Marker): MarkerSnapshot {
  return {
    timeSec: marker.timeSec,
    type: marker.type,
    adIds: marker.markerAds.map((markerAd) => markerAd.adId),
  };
}

type MarkerContextValue = {
  markers: Marker[];
  createMarker: (type: MarkerType, adIds: string[]) => void;
  autoCreateMarker: () => void;
  editMarker: (markerId: string, timeSec: number, adIds: string[]) => void;
  deleteMarker: (markerId: string) => void;
  moveMarker: (markerId: string, newTimeSec: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  adState: AdInjectionState;
  onAdEnded: () => void;
  suppressAdChecks: () => void;
  unsuppressAdChecks: () => void;
  resetAdChecks: (seekTime: number) => void;
  markAllMarkersAsPlayed: () => void;
};

const MarkerContext = createContext<MarkerContextValue | null>(null);

type MarkerProviderProps = {
  episodeId: string;
  initialMarkers: Marker[];
  children: ReactNode;
};

type MarkerPlaybackSyncProps = {
  adCheck: (currentTime: number) => void;
  currentTimeRef: React.MutableRefObject<number>;
  isPlayingAd: boolean;
};

function MarkerPlaybackSync({
  adCheck,
  currentTimeRef,
  isPlayingAd,
}: MarkerPlaybackSyncProps) {
  const currentTime = useEditorPlaybackCurrentTime();

  useEffect(() => {
    currentTimeRef.current = currentTime;
    if (!isPlayingAd) {
      adCheck(currentTime);
    }
  }, [currentTime, adCheck, currentTimeRef, isPlayingAd]);

  return null;
}

export function MarkerProvider({
  episodeId,
  initialMarkers,
  children,
}: MarkerProviderProps) {
  const { pause, play } = useEditorPlaybackControls();
  const duration = useEditorPlaybackDuration();
  const { data: markers = initialMarkers } = useMarkers(episodeId, initialMarkers);
  const createMutation = useCreateMarker(episodeId);
  const deleteMutation = useDeleteMarker(episodeId);
  const updateMutation = useUpdateMarker(episodeId);
  const { toast } = useToast();
  const { data: allAds = [] } = useAds();
  const {
    canUndo,
    canRedo,
    push,
    undo: rawUndo,
    redo: rawRedo,
  } = useUndoRedo();
  const markerTargetsRef = useRef<Map<string, MarkerCommandTarget>>(new Map());
  const currentTimeRef = useRef(0);

  const {
    state: adState,
    check: adCheck,
    onAdEnded,
    reset: resetAdChecks,
    markAsPlayed,
    suppress: suppressAdChecks,
    unsuppress: unsuppressAdChecks,
  } = useAdInjection(markers, pause, play);

  function getMarkerTarget(markerId: string): MarkerCommandTarget {
    const existingTarget = markerTargetsRef.current.get(markerId);
    if (existingTarget) {
      return existingTarget;
    }

    const target = { currentId: markerId };
    markerTargetsRef.current.set(markerId, target);
    return target;
  }

  function syncMarkerTargetId(target: MarkerCommandTarget, nextId: string) {
    const previousId = target.currentId;
    target.currentId = nextId;

    if (previousId !== nextId) {
      markerTargetsRef.current.delete(previousId);
      markerTargetsRef.current.set(nextId, target);
    }
  }

  async function createMarkerRecord(
    snapshot: MarkerSnapshot,
    options?: {
      successMessage?: string;
      errorMessage?: string;
    },
  ) {
    try {
      const marker = await createMutation.mutateAsync(snapshot);
      markAsPlayed(marker.id);

      if (options?.successMessage) {
        toast(options.successMessage);
      }

      return marker;
    } catch (error) {
      toast(options?.errorMessage ?? "Failed to create marker", "error");
      throw error;
    }
  }

  async function deleteMarkerRecord(
    markerId: string,
    options?: {
      successMessage?: string;
      errorMessage?: string;
    },
  ) {
    try {
      await deleteMutation.mutateAsync(markerId);

      if (options?.successMessage) {
        toast(options.successMessage);
      }
    } catch (error) {
      toast(options?.errorMessage ?? "Failed to delete marker", "error");
      throw error;
    }
  }

  async function updateMarkerRecord(
    markerId: string,
    snapshot: Pick<MarkerSnapshot, "timeSec" | "adIds">,
    options?: {
      successMessage?: string;
      errorMessage?: string;
    },
  ) {
    try {
      markAsPlayed(markerId);
      const marker = await updateMutation.mutateAsync({
        markerId,
        timeSec: snapshot.timeSec,
        adIds: snapshot.adIds,
      });

      if (options?.successMessage) {
        toast(options.successMessage);
      }

      return marker;
    } catch (error) {
      toast(options?.errorMessage ?? "Failed to update marker", "error");
      throw error;
    }
  }

  function undo() {
    void rawUndo().catch(() => {});
  }

  function redo() {
    void rawRedo().catch(() => {});
  }

  function createMarker(type: MarkerType, adIds: string[]) {
    const markerTime = currentTimeRef.current;
    const snapshot = { timeSec: markerTime, type, adIds };

    void (async () => {
      try {
        const marker = await createMarkerRecord(snapshot, {
          successMessage: "Marker created",
        });
        const target = getMarkerTarget(marker.id);
        syncMarkerTargetId(target, marker.id);

        push({
          undo: () => deleteMarkerRecord(target.currentId),
          redo: async () => {
            const recreatedMarker = await createMarkerRecord(snapshot);
            syncMarkerTargetId(target, recreatedMarker.id);
          },
        });
      } catch {}
    })();
  }

  function autoCreateMarker() {
    if (duration <= 1 || allAds.length === 0) {
      toast("Need a loaded video and at least one ad", "error");
      return;
    }

    const usedTimes = new Set(markers.map((marker) => Math.floor(marker.timeSec)));
    const maxAttempts = 100;
    let randomTime: number | null = null;

    for (let i = 0; i < maxAttempts; i++) {
      const candidate = Math.floor(Math.random() * (duration - 1)) + 1;
      if (!usedTimes.has(candidate)) {
        randomTime = candidate;
        break;
      }
    }

    if (randomTime === null) {
      toast("No unique time available - all seconds are taken", "error");
      return;
    }

    const randomAd = allAds[Math.floor(Math.random() * allAds.length)];
    const snapshot = {
      timeSec: randomTime,
      type: "AUTO" as const,
      adIds: [randomAd.id],
    };

    void (async () => {
      try {
        const marker = await createMarkerRecord(snapshot, {
          successMessage: `Marker auto-placed at ${formatAutoTime(randomTime)}`,
        });
        const target = getMarkerTarget(marker.id);
        syncMarkerTargetId(target, marker.id);

        push({
          undo: () => deleteMarkerRecord(target.currentId),
          redo: async () => {
            const recreatedMarker = await createMarkerRecord(snapshot);
            syncMarkerTargetId(target, recreatedMarker.id);
          },
        });
      } catch {}
    })();
  }

  function deleteMarker(markerId: string) {
    const marker = markers.find((entry) => entry.id === markerId);
    if (!marker) {
      toast("Marker not found", "error");
      return;
    }

    const snapshot = getMarkerSnapshot(marker);
    const target = getMarkerTarget(marker.id);

    void (async () => {
      try {
        await deleteMarkerRecord(target.currentId, {
          successMessage: "Marker deleted",
        });

        push({
          undo: async () => {
            const recreatedMarker = await createMarkerRecord(snapshot);
            syncMarkerTargetId(target, recreatedMarker.id);
          },
          redo: () => deleteMarkerRecord(target.currentId),
        });
      } catch {}
    })();
  }

  function editMarker(markerId: string, timeSec: number, adIds: string[]) {
    const marker = markers.find((entry) => entry.id === markerId);
    if (!marker) {
      toast("Marker not found", "error");
      return;
    }

    const previousSnapshot = getMarkerSnapshot(marker);
    const nextSnapshot = {
      timeSec,
      type: marker.type,
      adIds,
    };
    const target = getMarkerTarget(marker.id);

    void (async () => {
      try {
        await updateMarkerRecord(target.currentId, nextSnapshot, {
          successMessage: "Marker updated",
        });

        push({
          undo: async () => {
            await updateMarkerRecord(target.currentId, previousSnapshot, {
              errorMessage: "Failed to undo marker update",
            });
          },
          redo: async () => {
            await updateMarkerRecord(target.currentId, nextSnapshot, {
              errorMessage: "Failed to redo marker update",
            });
          },
        });
      } catch {}
    })();
  }

  function moveMarker(markerId: string, newTimeSec: number) {
    const marker = markers.find((entry) => entry.id === markerId);
    if (!marker) {
      toast("Marker not found", "error");
      return;
    }

    const previousSnapshot = getMarkerSnapshot(marker);
    const nextSnapshot = {
      timeSec: newTimeSec,
      type: marker.type,
      adIds: previousSnapshot.adIds,
    };
    const target = getMarkerTarget(marker.id);

    void (async () => {
      try {
        await updateMarkerRecord(target.currentId, nextSnapshot, {
          errorMessage: "Failed to move marker",
        });

        push({
          undo: async () => {
            await updateMarkerRecord(target.currentId, previousSnapshot, {
              errorMessage: "Failed to undo marker move",
            });
          },
          redo: async () => {
            await updateMarkerRecord(target.currentId, nextSnapshot, {
              errorMessage: "Failed to redo marker move",
            });
          },
        });
      } catch {}
    })();
  }

  function markAllMarkersAsPlayed() {
    for (const marker of markers) {
      markAsPlayed(marker.id);
    }
  }

  return (
    <>
      <MarkerPlaybackSync
        adCheck={adCheck}
        currentTimeRef={currentTimeRef}
        isPlayingAd={adState.isPlayingAd}
      />
      <MarkerContext.Provider
        value={{
          markers,
          createMarker,
          autoCreateMarker,
          editMarker,
          deleteMarker,
          moveMarker,
          canUndo,
          canRedo,
          undo,
          redo,
          adState,
          onAdEnded,
          suppressAdChecks,
          unsuppressAdChecks,
          resetAdChecks,
          markAllMarkersAsPlayed,
        }}
      >
        {children}
      </MarkerContext.Provider>
    </>
  );
}

export function useEditorMarkers(): MarkerContextValue {
  const ctx = useContext(MarkerContext);
  if (!ctx) {
    throw new Error("useEditorMarkers must be used within a MarkerProvider");
  }
  return ctx;
}
