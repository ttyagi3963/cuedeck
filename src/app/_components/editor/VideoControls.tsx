"use client";

import type { PlaybackState } from "@/contracts/video";
import {
  SkipToStart,
  ClockRewind,
  RewindFill,
  PlayFill,
  PauseFill,
  FastForwardFill,
  ClockForward,
  SkipToEnd,
} from "@/app/_components/ui/icons";
import Button from "@/app/_components/ui/Button";

type VideoControlsProps = {
  state: PlaybackState;
  toggle: () => void;
  skip: (seconds: number) => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
};

export default function VideoControls({
  state,
  toggle,
  skip,
  jumpToStart,
  jumpToEnd,
}: VideoControlsProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border-default bg-surface p-4 [&_*]:cursor-pointer">
      {/* Jump to start */}
      <Button
        variant="ghost"
        onClick={jumpToStart}
        className="flex items-center gap-2"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle">
          <SkipToStart className="text-text-heading" />
        </span>
        <span className="text-sm font-semibold text-text-muted">
          Jump to start
        </span>
      </Button>

      {/* Center controls */}
      <div className="flex items-center gap-8">
        <Button
          variant="ghost"
          onClick={() => skip(-10)}
          aria-label="Skip back 10 seconds"
          className="flex items-center gap-2"
        >
          <ClockRewind className="text-text-heading" />
          <span className="text-sm font-semibold text-text-muted">10s</span>
        </Button>

        <Button
          variant="ghost"
          onClick={() => skip(-5)}
          aria-label="Rewind"
          className="text-text-heading"
        >
          <RewindFill />
        </Button>

        <Button
          variant="ghost"
          onClick={toggle}
          aria-label={state.isPlaying ? "Pause" : "Play"}
          className="text-text-heading"
        >
          {state.isPlaying ? <PauseFill /> : <PlayFill />}
        </Button>

        <Button
          variant="ghost"
          onClick={() => skip(5)}
          aria-label="Fast forward"
          className="text-text-heading"
        >
          <FastForwardFill />
        </Button>

        <Button
          variant="ghost"
          onClick={() => skip(10)}
          aria-label="Skip forward 10 seconds"
          className="flex items-center gap-2"
        >
          <span className="text-sm font-semibold text-text-muted">10s</span>
          <ClockForward className="text-text-heading" />
        </Button>
      </div>

      {/* Jump to end */}
      <Button
        variant="ghost"
        onClick={jumpToEnd}
        className="flex items-center gap-2"
      >
        <span className="text-sm font-semibold text-text-muted">
          Jump to end
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle">
          <SkipToEnd className="text-text-heading" />
        </span>
      </Button>
    </div>
  );
}
