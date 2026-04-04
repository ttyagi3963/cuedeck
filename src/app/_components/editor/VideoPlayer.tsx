"use client";

import { forwardRef } from "react";

type VideoPlayerProps = {
  src: string;
  poster?: string;
};

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src, poster }, ref) => {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <video
          ref={ref}
          src={src}
          poster={poster}
          className="h-full w-full object-contain"
          playsInline
          preload="metadata"
        />
      </div>
    );
  },
);

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
