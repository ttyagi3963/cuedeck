"use client";

import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import VideoPlayer from "./VideoPlayer";
import VideoControls from "./VideoControls";
import AdMarkers from "./AdMarkers";

export default function EditorPage() {
  const { videoRef, state, toggle, skip, jumpToStart, jumpToEnd } =
    useVideoPlayer();

  return (
    <div className="flex flex-col gap-8 p-16">
      {/* Two-column: ad markers + video */}
      <div className="flex gap-8">
        <AdMarkers />
        <div className="flex flex-1 flex-col gap-4 rounded-xl border border-border-default bg-surface p-8">
          <VideoPlayer ref={videoRef} src="/videos/episodes/episode1.MP4" />
          <VideoControls
            state={state}
            toggle={toggle}
            skip={skip}
            jumpToStart={jumpToStart}
            jumpToEnd={jumpToEnd}
          />
        </div>
      </div>
    </div>
  );
}
