export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isReady: boolean;
}

export interface VideoPlayerControls {
  videoRef: (node: HTMLVideoElement | null) => void;
  state: PlaybackState;
  isMuted: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  toggleMute: () => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
}
