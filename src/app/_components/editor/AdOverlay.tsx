"use client";

import { useState } from "react";
import type { Ad } from "@/contracts/ad";
import Spinner from "@/app/_components/ui/Spinner";

type AdOverlayProps = {
  ad: Ad;
  onEnded: () => void;
};

export default function AdOverlay({ ad, onEnded }: AdOverlayProps) {
  const [isBuffering, setIsBuffering] = useState(true);

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-video-bg">
      <div className="absolute left-3 top-3 z-30 rounded bg-yellow-500 px-2 py-0.5 text-xs font-bold text-text-on-warning">
        Ad &middot; {ad.title}
      </div>

      {isBuffering && (
        <div className="absolute inset-0 z-25 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      <video
        src={ad.videoUrl}
        className="h-full w-full object-contain"
        autoPlay
        muted
        playsInline
        onEnded={onEnded}
        onPlaying={() => setIsBuffering(false)}
        onWaiting={() => setIsBuffering(true)}
      />
    </div>
  );
}
