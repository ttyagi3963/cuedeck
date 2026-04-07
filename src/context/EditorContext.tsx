"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { Episode } from "@/contracts/episode";
import type { Marker, MarkerType } from "@/contracts/marker";
import type { PlaybackState } from "@/contracts/video";
import { useAdInjection, type AdInjectionState } from "@/hooks/useAdInjection";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMarkers } from "@/hooks/useMarkers";
import {
  useCreateMarker,
  useDeleteMarker,
  useUpdateMarker,
} from "@/hooks/useMarkerMutations";
import { useToast } from "@/hooks/useToast";
import { useAds } from "@/hooks/useAds";

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

// ---------------------------------------------------------------------------
// Context value
// ---------------------------------------------------------------------------

type EditorContextValue = {
  /** Source episode data */
  episode: Episode;

  /** Low-level video ref callback — attach to the <video> element */
  videoRef: (node: HTMLVideoElement | null) => void;

  /** Current playback state (currentTime, duration, isPlaying, isReady) */
  playback: PlaybackState;

  // Playback actions
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;

  // Markers
  markers: Marker[];
  createMarker: (type: MarkerType, adIds: string[]) => void;
  autoCreateMarker: () => void;
  editMarker: (markerId: string, timeSec: number, adIds: string[]) => void;
  deleteMarker: (markerId: string) => void;
  moveMarker: (markerId: string, newTimeSec: number) => void;

  // Create-marker dialog
  isCreateDialogOpen: boolean;
  openCreateDialog: () => void;
  closeCreateDialog: () => void;

  // Edit-marker dialog
  editingMarker: Marker | null;
  openEditDialog: (marker: Marker) => void;
  closeEditDialog: () => void;

  // Undo / Redo
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  // Ad injection
  adState: AdInjectionState;
  onAdEnded: () => void;
  suppressAdChecks: () => void;
  unsuppressAdChecks: () => void;
};

const EditorContext = createContext<EditorContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

type EditorProviderProps = {
  episode: Episode;
  initialMarkers: Marker[];
  children: ReactNode;
};

export function EditorProvider({
  episode,
  initialMarkers,
  children,
}: EditorProviderProps) {
  // Dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingMarker, setEditingMarker] = useState<Marker | null>(null);

  // Video playback
  const {
    videoRef,
    state: playback,
    play,
    pause,
    toggle,
    seek: rawSeek,
    skip,
  } = useVideoPlayer(episode.sourceUrl);

  // Undo / redo (seek-position history)
  const {
    canUndo,
    canRedo,
    push,
    undo: rawUndo,
    redo: rawRedo,
  } = useUndoRedo();
  const markerTargetsRef = useRef<Map<string, MarkerCommandTarget>>(new Map());

  // Markers (React Query)
  const { data: markers } = useMarkers(episode.id, initialMarkers);
  const createMutation = useCreateMarker(episode.id);
  const deleteMutation = useDeleteMarker(episode.id);
  const updateMutation = useUpdateMarker(episode.id);
  const { toast } = useToast();
  const { data: allAds = [] } = useAds();

  // Ad injection
  const adInjection = useAdInjection(markers, pause, play);
  const { check: adCheck, state: adStateVal } = adInjection;

  // Trigger ad checks on every time update
  useEffect(() => {
    if (!adStateVal.isPlayingAd) {
      adCheck(playback.currentTime);
    }
  }, [playback.currentTime, adCheck, adStateVal.isPlayingAd]);

  // ---------------------------------------------------------------------------
  // Composed actions
  // ---------------------------------------------------------------------------

  function seek(time: number) {
    if (time < playback.currentTime) {
      adInjection.reset(time);
    }
    rawSeek(time);
  }

  function jumpToStart() {
    adInjection.suppress();
    rawSeek(2);
    // Mark all markers as played so none trigger after landing
    for (const m of markers) {
      adInjection.markAsPlayed(m.id);
    }
    adInjection.unsuppress(2);
  }

  function jumpToEnd() {
    adInjection.suppress();
    rawSeek(playback.duration);
    for (const m of markers) {
      adInjection.markAsPlayed(m.id);
    }
    adInjection.unsuppress(playback.duration);
  }

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
      adInjection.markAsPlayed(marker.id);

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
      adInjection.markAsPlayed(markerId);
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
    const markerTime = playback.currentTime;
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
    const dur = playback.duration;
    if (dur <= 1 || allAds.length === 0) {
      toast("Need a loaded video and at least one ad", "error");
      return;
    }

    const usedTimes = new Set(markers.map((m) => Math.floor(m.timeSec)));
    const maxAttempts = 100;
    let randomTime: number | null = null;

    for (let i = 0; i < maxAttempts; i++) {
      const candidate = Math.floor(Math.random() * (dur - 1)) + 1;
      if (!usedTimes.has(candidate)) {
        randomTime = candidate;
        break;
      }
    }

    if (randomTime === null) {
      toast("No unique time available — all seconds are taken", "error");
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
          undo: () =>
            updateMarkerRecord(target.currentId, previousSnapshot, {
              errorMessage: "Failed to undo marker update",
            }),
          redo: () =>
            updateMarkerRecord(target.currentId, nextSnapshot, {
              errorMessage: "Failed to redo marker update",
            }),
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
          undo: () =>
            updateMarkerRecord(target.currentId, previousSnapshot, {
              errorMessage: "Failed to undo marker move",
            }),
          redo: () =>
            updateMarkerRecord(target.currentId, nextSnapshot, {
              errorMessage: "Failed to redo marker move",
            }),
        });
      } catch {}
    })();
  }

  // ---------------------------------------------------------------------------
  // Global keyboard shortcuts
  // ---------------------------------------------------------------------------

  useKeyboardShortcuts({
    " ": toggle,
    z: undo,
    y: redo,
  });

  // ---------------------------------------------------------------------------
  // Value
  // ---------------------------------------------------------------------------

  const value: EditorContextValue = {
    episode,
    videoRef,
    playback,
    play,
    pause,
    toggle,
    seek,
    skip,
    jumpToStart,
    jumpToEnd,
    markers,
    createMarker,
    autoCreateMarker,
    editMarker,
    deleteMarker,
    moveMarker,
    isCreateDialogOpen,
    openCreateDialog: () => setIsCreateDialogOpen(true),
    closeCreateDialog: () => setIsCreateDialogOpen(false),
    editingMarker,
    openEditDialog: (marker: Marker) => setEditingMarker(marker),
    closeEditDialog: () => setEditingMarker(null),
    canUndo,
    canRedo,
    undo,
    redo,
    adState: adInjection.state,
    onAdEnded: adInjection.onAdEnded,
    suppressAdChecks: adInjection.suppress,
    unsuppressAdChecks: () => adInjection.unsuppress(playback.currentTime),
  };

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return ctx;
}
