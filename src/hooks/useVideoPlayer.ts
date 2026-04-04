"use client";

import { useRef, useState, useEffect } from "react";
import type { PlaybackState, VideoPlayerControls } from "@/contracts/video";

export function useVideoPlayer(): VideoPlayerControls {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [state, setState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isReady: false,
  });

  function toggle() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  function seek(time: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(time, video.duration || 0));
  }

  function skip(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    seek(video.currentTime + seconds);
  }

  function jumpToStart() {
    seek(0);
  }

  function jumpToEnd() {
    const video = videoRef.current;
    if (!video) return;
    seek(video.duration);
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setState((prev) => ({ ...prev, isPlaying: true }));
    const onPause = () => setState((prev) => ({ ...prev, isPlaying: false }));
    const onTimeUpdate = () =>
      setState((prev) => ({ ...prev, currentTime: video.currentTime }));
    const onLoadedMetadata = () =>
      setState((prev) => ({
        ...prev,
        duration: video.duration,
        isReady: true,
      }));
    const onEnded = () => setState((prev) => ({ ...prev, isPlaying: false }));

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("ended", onEnded);

    //cl;eanup
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  return { videoRef, state, toggle, seek, skip, jumpToStart, jumpToEnd };
}
