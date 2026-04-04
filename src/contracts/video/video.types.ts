import type { RefObject } from "react";

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isReady: boolean;
}

type VideoRef = RefObject<HTMLVideoElement | null>;

export interface VideoPlayerControls {
  videoRef: VideoRef;
  state: PlaybackState;
  toggle: () => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
}
