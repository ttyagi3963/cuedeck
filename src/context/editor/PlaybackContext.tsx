"use client";

import {
  createContext,
  useContext,
  useMemo,
  type Context,
  type ReactNode,
} from "react";
import type { Episode } from "@/contracts/episode";
import type { PlaybackState } from "@/contracts/video";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";

type PlaybackControlsContextValue = {
  episode: Episode;
  videoRef: (node: HTMLVideoElement | null) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
};

type PlaybackContextValue = PlaybackControlsContextValue & {
  playback: PlaybackState;
};

const PlaybackControlsContext =
  createContext<PlaybackControlsContextValue | null>(null);
const PlaybackCurrentTimeContext = createContext<number | null>(null);
const PlaybackDurationContext = createContext<number | null>(null);
const PlaybackIsPlayingContext = createContext<boolean | null>(null);
const PlaybackIsReadyContext = createContext<boolean | null>(null);

type PlaybackProviderProps = {
  episode: Episode;
  children: ReactNode;
};

export function PlaybackProvider({
  episode,
  children,
}: PlaybackProviderProps) {
  const {
    videoRef,
    state: playback,
    play,
    pause,
    toggle,
    seek,
    skip,
    jumpToStart,
    jumpToEnd,
  } = useVideoPlayer(episode.sourceUrl);

  const controlsValue = useMemo(
    () => ({
      episode,
      videoRef,
      play,
      pause,
      toggle,
      seek,
      skip,
      jumpToStart,
      jumpToEnd,
    }),
    [episode, videoRef, play, pause, toggle, seek, skip, jumpToStart, jumpToEnd],
  );

  return (
    <PlaybackControlsContext.Provider value={controlsValue}>
      <PlaybackIsReadyContext.Provider value={playback.isReady}>
        <PlaybackIsPlayingContext.Provider value={playback.isPlaying}>
          <PlaybackDurationContext.Provider value={playback.duration}>
            <PlaybackCurrentTimeContext.Provider value={playback.currentTime}>
              {children}
            </PlaybackCurrentTimeContext.Provider>
          </PlaybackDurationContext.Provider>
        </PlaybackIsPlayingContext.Provider>
      </PlaybackIsReadyContext.Provider>
    </PlaybackControlsContext.Provider>
  );
}

function useRequiredContext<T>(context: Context<T | null>, hookName: string): T {
  const value = useContext(context);
  if (value === null) {
    throw new Error(`${hookName} must be used within a PlaybackProvider`);
  }

  return value;
}

export function useEditorPlaybackControls(): PlaybackControlsContextValue {
  return useRequiredContext(PlaybackControlsContext, "useEditorPlaybackControls");
}

export function useEditorPlaybackCurrentTime() {
  return useRequiredContext(
    PlaybackCurrentTimeContext,
    "useEditorPlaybackCurrentTime",
  );
}

export function useEditorPlaybackDuration() {
  return useRequiredContext(
    PlaybackDurationContext,
    "useEditorPlaybackDuration",
  );
}

export function useEditorPlaybackIsPlaying() {
  return useRequiredContext(
    PlaybackIsPlayingContext,
    "useEditorPlaybackIsPlaying",
  );
}

export function useEditorPlaybackIsReady() {
  return useRequiredContext(PlaybackIsReadyContext, "useEditorPlaybackIsReady");
}

export function useEditorPlayback(): PlaybackContextValue {
  const controls = useEditorPlaybackControls();
  const currentTime = useEditorPlaybackCurrentTime();
  const duration = useEditorPlaybackDuration();
  const isPlaying = useEditorPlaybackIsPlaying();
  const isReady = useEditorPlaybackIsReady();

  return {
    ...controls,
    playback: {
      currentTime,
      duration,
      isPlaying,
      isReady,
    },
  };
}
