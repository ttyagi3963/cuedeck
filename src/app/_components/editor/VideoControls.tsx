"use client";

import { useEditor } from "@/context/EditorContext";
import {
  SkipToStart,
  ClockRewind,
  RewindFill,
  PlayFill,
  PauseFill,
  FastForwardFill,
  ClockForward,
  SkipToEnd,
  Undo,
  Redo,
  VolumeOn,
  VolumeOff,
} from "@/app/_components/ui/icons";
import Button from "@/app/_components/ui/Button";

export default function VideoControls() {
  const {
    playback,
    toggle,
    skip,
    jumpToStart,
    jumpToEnd,
    canUndo,
    canRedo,
    undo,
    redo,
    isMuted,
    toggleMute,
  } = useEditor();
  return (
    <div className="flex items-center justify-between gap-content-gap-xs rounded-ad-markers border border-border-default bg-surface p-content-p-xs lg:p-content-p-sm [&_*]:cursor-pointer">
      <Button
        variant="ghost"
        onClick={jumpToStart}
        className="flex shrink-0 items-center gap-content-gap-xs"
        aria-label="Jump to start"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border-subtle">
          <SkipToStart className="text-text-heading" />
        </span>
        <span className="hidden xl:inline text-sm font-semibold text-text-muted">
          Jump to start
        </span>
      </Button>

      <div className="flex items-center gap-content-gap-xs lg:gap-content-gap-md">
        <Button
          variant="ghost"
          onClick={() => skip(-10)}
          aria-label="Skip back 10 seconds"
          className="flex items-center gap-content-gap-xs"
        >
          <ClockRewind className="text-text-heading" />
          <span className="hidden lg:inline text-sm font-semibold text-text-muted">
            10s
          </span>
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
          aria-label={playback.isPlaying ? "Pause" : "Play"}
          className="text-text-heading"
        >
          {playback.isPlaying ? <PauseFill /> : <PlayFill />}
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
          className="flex items-center gap-content-gap-xs"
        >
          <span className="hidden lg:inline text-sm font-semibold text-text-muted">
            10s
          </span>
          <ClockForward className="text-text-heading" />
        </Button>
      </div>

      <div className="flex items-center gap-content-gap-xs">
        <Button
          variant="ghost"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
          className="text-text-heading"
        >
          {isMuted ? (
            <VolumeOff className="size-5" />
          ) : (
            <VolumeOn className="size-5" />
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={jumpToEnd}
          className="flex shrink-0 items-center gap-content-gap-xs"
          aria-label="Jump to end"
        >
          <span className="hidden xl:inline text-sm font-semibold text-text-muted">
            Jump to end
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border-subtle">
            <SkipToEnd className="text-text-heading" />
          </span>
        </Button>
      </div>
    </div>
  );
}
