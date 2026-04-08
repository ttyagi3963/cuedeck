"use client";

import { useState, useCallback } from "react";
import { formatTime } from "@/utils/time";
import { useEditor } from "@/context/EditorContext";
import Spinner from "@/app/_components/ui/Spinner";
import ProgressSlider from "./ProgressSlider";
import AdOverlay from "./AdOverlay";

export default function VideoPlayer() {
  const {
    episode,
    videoRef,
    playback,
    seek,
    toggle,
    adState,
    onAdEnded,
    markers,
    moveMarker,
  } = useEditor();

  const [hoverState, setHoverState] = useState<{
    time: number;
    percent: number;
  } | null>(null);

  const handleHover = useCallback((time: number, percent: number) => {
    setHoverState({ time, percent });
  }, []);

  const handleHoverEnd = useCallback(() => {
    setHoverState(null);
  }, []);

  return (
    <div className="group/video relative aspect-video w-full overflow-hidden rounded-dialog bg-video-bg">
      {adState.isPlayingAd && adState.currentAd && (
        <AdOverlay ad={adState.currentAd} onEnded={onAdEnded} />
      )}

      {!playback.isReady && !adState.isPlayingAd && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-video-bg/80 backdrop-blur-[1px]">
          <div className="flex items-center gap-content-gap-md rounded-full border border-border-on-primary/60 bg-surface/85 px-4 py-2 shadow-sm">
            <Spinner size="sm" />
            <span className="text-sm font-semibold text-text-heading">
              Loading video...
            </span>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className="h-full w-full cursor-pointer object-contain"
        playsInline
        preload="metadata"
        onClick={toggle}
      />

      <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8 opacity-0 transition-all duration-200 group-hover/video:translate-y-0 group-hover/video:opacity-100">
        {hoverState && (
          <div
            className="absolute bottom-full mb-3 -translate-x-1/2 pointer-events-none"
            style={{ left: `calc(${hoverState.percent}% * 0.92 + 4%)` }}
          >
            <div className="overflow-hidden rounded-button-primary border-2 border-border-on-primary/80 shadow-lg">
              <video
                src={episode.sourceUrl}
                ref={(el) => {
                  if (el) el.currentTime = hoverState.time;
                }}
                className="h-[90px] w-[160px] object-cover"
                muted
                preload="metadata"
              />
            </div>
            <div className="mt-1 text-center text-xs font-semibold text-text-on-primary">
              {formatTime(hoverState.time)}
            </div>
          </div>
        )}

        <ProgressSlider
          currentTime={playback.currentTime}
          duration={playback.duration}
          markers={markers}
          onSeek={seek}
          onMarkerDrag={moveMarker}
          onHover={handleHover}
          onHoverEnd={handleHoverEnd}
        />
      </div>
    </div>
  );
}
