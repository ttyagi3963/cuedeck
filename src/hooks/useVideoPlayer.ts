"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type MutableRefObject,
} from "react";
import Hls from "hls.js";
import type { PlaybackState, VideoPlayerControls } from "@/contracts/video";

export function useVideoPlayer(src: string): VideoPlayerControls {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
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

  // Attach HLS or direct source
  useEffect(() => {
    const video = videoEl;
    if (!video || !src) return;

    const isHlsSource = src.endsWith(".m3u8");

    if (isHlsSource && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    // Safari handles HLS natively; for non-HLS sources use direct src
    video.src = src;
    return undefined;
  }, [videoEl, src]);

  function toggle() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  function play() {
    const video = videoRef.current;
    if (!video) return;
    video.play();
  }

  function pause() {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
  }

  function seek(time: number) {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
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
    const onLoadedData = () => {
      // Show the first frame instead of a black screen
      if (video.currentTime === 0) {
        video.currentTime = 2;
      }
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("loadeddata", onLoadedData);
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
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("ended", onEnded);
    };
  }, [videoEl]);

  return {
    videoRef: setRef,
    state,
    play,
    pause,
    toggle,
    seek,
    skip,
    jumpToStart,
    jumpToEnd,
  };
}
