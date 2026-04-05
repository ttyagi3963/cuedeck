"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type MutableRefObject,
} from "react";
import type { PlaybackState, VideoPlayerControls } from "@/contracts/video";

export function useVideoPlayer(): VideoPlayerControls {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);

  const [state, setState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isReady: false,
  });

  // Re-capture the element whenever the ref changes (e.g. after loading state resolves)
  const setRef = useCallback((node: HTMLVideoElement | null) => {
    (videoRef as MutableRefObject<HTMLVideoElement | null>).current = node;
    setVideoEl(node);
  }, []);

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
    const video = videoEl;
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

    // If metadata already loaded (e.g. from cache), sync immediately
    if (video.readyState >= 1) {
      setState((prev) => ({
        ...prev,
        duration: video.duration,
        isReady: true,
      }));
    }

    // cleanup
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("ended", onEnded);
    };
  }, [videoEl]);

  return {
    videoRef: setRef,
    state,
    toggle,
    seek,
    skip,
    jumpToStart,
    jumpToEnd,
  };
}
