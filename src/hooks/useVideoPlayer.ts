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

type InternalPlaybackState = Omit<PlaybackState, "isReady">;

export function useVideoPlayer(src: string): VideoPlayerControls {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const appliedSourceRef = useRef<string | null>(null);
  const pendingSourceRestoreRef = useRef<{
    src: string;
    currentTime: number;
    shouldResume: boolean;
  } | null>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);

  const [state, setState] = useState<InternalPlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  });
  const [readySourceUrl, setReadySourceUrl] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  const applyDirectSource = useCallback(
    (video: HTMLVideoElement, nextSrc: string) => {
      if (video.src !== nextSrc) {
        video.src = nextSrc;
      }
      video.load();
    },
    [],
  );

  const setRef = useCallback((node: HTMLVideoElement | null) => {
    (videoRef as MutableRefObject<HTMLVideoElement | null>).current = node;
    setVideoEl(node);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || video !== videoEl || !src) return;

    const previousSource = appliedSourceRef.current;
    if (previousSource && previousSource !== src) {
      pendingSourceRestoreRef.current = {
        src,
        currentTime: video.currentTime,
        shouldResume: !video.paused,
      };
    }
    appliedSourceRef.current = src;

    const isHlsSource = src.endsWith(".m3u8");

    if (isHlsSource && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) {
          return;
        }

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
          return;
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
          return;
        }

        hls.destroy();
      });
      hlsRef.current = hls;

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    applyDirectSource(video, src);
    return undefined;
  }, [applyDirectSource, videoEl, src]);

  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      // Ignore the AbortError that browsers throw when a subsequent seek or
    // pause interrupts an in-flight play(). It's benign here.
    video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, []);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    // Ignore the AbortError that browsers throw when a subsequent seek or
    // pause interrupts an in-flight play(). It's benign here.
    video.play().catch(() => undefined);
  }, []);

  const pause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const seek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    const shouldResume = !video.paused;
    const nextTime = Math.max(0, Math.min(time, video.duration || 0));
    video.currentTime = nextTime;
    setState((prev) => ({
      ...prev,
      currentTime: nextTime,
      isPlaying: shouldResume,
    }));

    if (shouldResume) {
      // Ignore the AbortError that browsers throw when a subsequent seek or
    // pause interrupts an in-flight play(). It's benign here.
    video.play().catch(() => undefined);
    }
  }, []);

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    seek(video.currentTime + seconds);
  }, [seek]);

  const jumpToStart = useCallback(() => {
    seek(0);
  }, [seek]);

  const jumpToEnd = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    seek(video.duration);
  }, [seek]);

  useEffect(() => {
    const video = videoEl;
    if (!video) return;

    const onPlay = () => setState((prev) => ({ ...prev, isPlaying: true }));
    const onPause = () => setState((prev) => ({ ...prev, isPlaying: false }));
    const onVolumeChange = () => setIsMuted(video.muted);
    const onLoadStart = () => setReadySourceUrl(null);
    const onWaiting = () => setReadySourceUrl(null);
    const markReady = () => setReadySourceUrl(src);
    const onTimeUpdate = () =>
      setState((prev) => ({ ...prev, currentTime: video.currentTime }));
    const onLoadedMetadata = () =>
      setState((prev) => ({
        ...prev,
        duration: video.duration,
      }));
    const onEnded = () => setState((prev) => ({ ...prev, isPlaying: false }));
    const onLoadedData = () => {
      const pendingRestore = pendingSourceRestoreRef.current;
      if (pendingRestore && pendingRestore.src === src) {
        pendingSourceRestoreRef.current = null;
        video.currentTime = Math.min(
          pendingRestore.currentTime,
          video.duration || pendingRestore.currentTime,
        );

        if (pendingRestore.shouldResume) {
          // Ignore the AbortError that browsers throw when a subsequent seek or
    // pause interrupts an in-flight play(). It's benign here.
    video.play().catch(() => undefined);
        }
        markReady();
        return;
      }

      markReady();
    };

    video.addEventListener("loadstart", onLoadStart);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", markReady);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("ended", onEnded);

    let isDisposed = false;

    if (video.readyState >= 1) {
      queueMicrotask(() => {
        if (isDisposed) return;
        onLoadedMetadata();
      });
    }

    return () => {
      isDisposed = true;
      video.removeEventListener("loadstart", onLoadStart);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", markReady);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("ended", onEnded);
    };
  }, [videoEl, src]);

  return {
    videoRef: setRef,
    state: {
      ...state,
      isReady: readySourceUrl === src,
    },
    isMuted,
    play,
    pause,
    toggle,
    toggleMute,
    seek,
    skip,
    jumpToStart,
    jumpToEnd,
  };
}
