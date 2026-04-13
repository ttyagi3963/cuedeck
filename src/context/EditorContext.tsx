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
  play: () => void;
  pause: () => void;
  toggle: () => void;
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
  suppressAdChecks: () => void;
  unsuppressAdChecks: () => void;
};

type EditorProviderProps = {
  episode: Episode;
  initialGenerationJobId?: string | null;
  children: ReactNode;
};

function EditorHotkeys({ children }: { children: ReactNode }) {
  const { toggle } = useEditorPlaybackControls();
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
    play,
    pause,
    toggle,
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
  const playback = {
    currentTime,
    duration,
    isPlaying,
    isReady,
  };

  function seek(time: number) {
    if (time < currentTime) {
      resetAdChecks(time);
    }
    rawSeek(time);
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
    play,
    pause,
    toggle,
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
