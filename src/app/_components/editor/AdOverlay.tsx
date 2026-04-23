"use client";

import { useEffect, useRef, useState } from "react";
import type { Ad } from "@/contracts/ad";
import { useEditor } from "@/context/EditorContext";
import Spinner from "@/app/_components/ui/Spinner";

type AdOverlayProps = {
  ad: Ad;
  onEnded: () => void;
  onTimeUpdate: (currentTime: number) => void;
};

export default function AdOverlay({ ad, onEnded, onTimeUpdate }: AdOverlayProps) {
  const { isMuted, setAdVideo, toggle, onAdPlay, onAdPause } = useEditor();
  const [isBuffering, setIsBuffering] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Register the ad video element with the editor so the top-level toggle
  // (spacebar, toolbar button, overlay click) can drive its play/pause.
  useEffect(() => {
    setAdVideo(videoRef.current);
    return () => setAdVideo(null);
  }, [setAdVideo]);

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col bg-video-bg cursor-pointer"
      onClick={toggle}
    >
      <div className="absolute left-3 top-3 z-30 rounded bg-yellow-500 px-2 py-0.5 text-xs font-bold text-text-on-warning">
        Ad &middot; {ad.title}
      </div>

      {isBuffering && (
        <div className="absolute inset-0 z-25 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      <video
        ref={videoRef}
        src={ad.videoUrl}
        className="h-full w-full object-contain"
        autoPlay
        muted={isMuted}
        playsInline
        onEnded={onEnded}
        onPlaying={() => setIsBuffering(false)}
        onWaiting={() => setIsBuffering(true)}
        onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
        onPlay={onAdPlay}
        onPause={onAdPause}
      />
    </div>
  );
}
