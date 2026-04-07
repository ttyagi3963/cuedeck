export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isReady: boolean;
}

export interface VideoPlayerControls {
  videoRef: (node: HTMLVideoElement | null) => void;
  state: PlaybackState;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
}
