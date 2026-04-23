"use client";

import type { ReactNode } from "react";
import type { Episode } from "@/contracts/episode";
import type { Marker, MarkerType } from "@/contracts/marker";
import type { PlaybackState } from "@/contracts/video";
import type { AdInjectionState } from "@/hooks/useAdInjection";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  PlaybackProvider,
  type PlaybackSourceKind,
  useEditorPlaybackControls,
  useEditorPlaybackCurrentTime,
  useEditorPlaybackDuration,
  useEditorPlaybackIsPlaying,
  useEditorPlaybackIsReady,
} from "./editor/PlaybackContext";
import { MarkerProvider, useEditorMarkers } from "./editor/MarkerContext";
import { EditorUIProvider, useEditorUI } from "./editor/EditorUIContext";

type EditorContextValue = {
  episode: Episode;
  videoRef: (node: HTMLVideoElement | null) => void;
  playback: PlaybackState;
  isMuted: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  toggleMute: () => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
  playbackSourceKind: PlaybackSourceKind;
  hasGeneratedPlaybackSource: boolean;
  setGeneratedPlaybackSource: (url: string) => void;
  clearGeneratedPlaybackSource: () => void;
  playOriginalSource: () => void;
  playGeneratedSource: () => void;
  markers: Marker[];
  createMarker: (type: MarkerType, adIds: string[]) => void;
  autoCreateMarker: () => void;
  editMarker: (markerId: string, timeSec: number, adIds: string[]) => void;
  deleteMarker: (markerId: string) => void;
  moveMarker: (markerId: string, newTimeSec: number) => void;
  isCreateDialogOpen: boolean;
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  isGenerateDialogOpen: boolean;
  openGenerateDialog: () => void;
  closeGenerateDialog: () => void;
  generationJobId: string | null;
  setGenerationJobId: (jobId: string) => void;
  clearGenerationJobId: () => void;
  editingMarker: Marker | null;
  openEditDialog: (marker: Marker) => void;
  closeEditDialog: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  adState: AdInjectionState;
  onAdEnded: () => void;
  onAdTimeUpdate: (currentTime: number) => void;
  onAdPlay: () => void;
  onAdPause: () => void;
  setAdVideo: (el: HTMLVideoElement | null) => void;
  suppressAdChecks: () => void;
  unsuppressAdChecks: () => void;
};

type EditorProviderProps = {
  episode: Episode;
  initialGenerationJobId?: string | null;
  children: ReactNode;
};

function EditorHotkeys({ children }: { children: ReactNode }) {
  // Use the ad-aware toggle from useEditor so spacebar pauses the ad video
  // while an ad is playing, instead of no-oping on the already-paused main
  // video underneath.
  const { toggle } = useEditor();
  const { undo, redo } = useEditorMarkers();

  useKeyboardShortcuts({
    " ": toggle,
    z: undo,
    y: redo,
  });

  return children;
}

export function EditorProvider({
  episode,
  initialGenerationJobId = null,
  children,
}: EditorProviderProps) {
  return (
    <PlaybackProvider episode={episode}>
      <MarkerProvider episodeId={episode.id}>
        <EditorUIProvider initialGenerationJobId={initialGenerationJobId}>
          <EditorHotkeys>{children}</EditorHotkeys>
        </EditorUIProvider>
      </MarkerProvider>
    </PlaybackProvider>
  );
}

export function useEditor(): EditorContextValue {
  const {
    episode,
    videoRef,
    isMuted,
    play: rawPlay,
    pause: rawPause,
    toggle: rawToggle,
    toggleMute,
    seek: rawSeek,
    skip,
    playbackSourceKind,
    hasGeneratedPlaybackSource,
    setGeneratedPlaybackSource,
    clearGeneratedPlaybackSource,
    playOriginalSource,
    playGeneratedSource,
  } = useEditorPlaybackControls();
  const currentTime = useEditorPlaybackCurrentTime();
  const duration = useEditorPlaybackDuration();
  const isPlaying = useEditorPlaybackIsPlaying();
  const isReady = useEditorPlaybackIsReady();
  const {
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
    onAdTimeUpdate,
    onAdPlay,
    onAdPause,
    setAdVideo,
    togglePlayPauseAd,
    pauseAd,
    playAd,
    suppressAdChecks,
    unsuppressAdChecks,
    resetAdChecks,
    markAllMarkersAsPlayed,
  } = useEditorMarkers();
  const {
    isCreateDialogOpen,
    openCreateDialog,
    closeCreateDialog,
    isGenerateDialogOpen,
    openGenerateDialog,
    closeGenerateDialog,
    generationJobId,
    setGenerationJobId,
    clearGenerationJobId,
    editingMarker,
    openEditDialog,
    closeEditDialog,
  } = useEditorUI();
  // While an ad is playing, the main <video>'s `isPlaying` is always
  // false (we force-paused it to let the ad run). Derive the effective
  // isPlaying from the ad's paused state so the toolbar play/pause icon
  // reflects what's visible on screen.
  const effectiveIsPlaying = adState.isPlayingAd
    ? !adState.isAdPaused
    : isPlaying;
  const playback = {
    currentTime,
    duration,
    isPlaying: effectiveIsPlaying,
    isReady,
  };

  function seek(time: number) {
    if (time < currentTime) {
      resetAdChecks(time);
    }
    rawSeek(time);
  }

  // While an ad is playing, the main <video> is intentionally paused —
  // hitting the toolbar Play/Pause or the spacebar would otherwise resume
  // the episode underneath the ad, or no-op on an already-paused element.
  // Route these controls to the ad <video> instead so the user's intent
  // ("pause the thing I'm watching right now") works during ad playback.
  function toggle() {
    if (adState.isPlayingAd) {
      togglePlayPauseAd();
      return;
    }
    rawToggle();
  }

  function play() {
    if (adState.isPlayingAd) {
      playAd();
      return;
    }
    rawPlay();
  }

  function pause() {
    if (adState.isPlayingAd) {
      pauseAd();
      return;
    }
    rawPause();
  }

  function jumpToStart() {
    suppressAdChecks();
    rawSeek(0);
    markAllMarkersAsPlayed();
    unsuppressAdChecks();
  }

  function jumpToEnd() {
    suppressAdChecks();
    rawSeek(playback.duration);
    markAllMarkersAsPlayed();
    unsuppressAdChecks();
  }

  return {
    episode,
    videoRef,
    playback,
    isMuted,
    play,
    pause,
    toggle,
    toggleMute,
    seek,
    skip,
    jumpToStart,
    jumpToEnd,
    playbackSourceKind,
    hasGeneratedPlaybackSource,
    setGeneratedPlaybackSource,
    clearGeneratedPlaybackSource,
    playOriginalSource,
    playGeneratedSource,
    markers,
    createMarker,
    autoCreateMarker,
    editMarker,
    deleteMarker,
    moveMarker,
    isCreateDialogOpen,
    openCreateDialog,
    closeCreateDialog,
    isGenerateDialogOpen,
    openGenerateDialog,
    closeGenerateDialog,
    generationJobId,
    setGenerationJobId,
    clearGenerationJobId,
    editingMarker,
    openEditDialog,
    closeEditDialog,
    canUndo,
    canRedo,
    undo,
    redo,
    adState,
    onAdEnded,
    onAdTimeUpdate,
    onAdPlay,
    onAdPause,
    setAdVideo,
    suppressAdChecks,
    unsuppressAdChecks,
  };
}

export {
  useEditorPlaybackControls,
  useEditorPlaybackCurrentTime,
  useEditorPlaybackDuration,
  useEditorPlaybackIsPlaying,
  useEditorPlaybackIsReady,
  useEditorPlaybackSourceKind,
} from "./editor/PlaybackContext";
export { useEditorMarkers } from "./editor/MarkerContext";
export { useEditorUI } from "./editor/EditorUIContext";
