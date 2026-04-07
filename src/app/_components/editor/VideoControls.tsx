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
  } = useEditor();
  return (
    <div className="flex items-center justify-between rounded-xl border border-border-default bg-surface p-4 [&_*]:cursor-pointer">
      {/* Left: undo / redo + jump to start */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={undo}
          disabled={!canUndo}
          aria-label="Undo"
          className="text-text-heading disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Undo />
        </Button>

        <Button
          variant="ghost"
          onClick={redo}
          disabled={!canRedo}
          aria-label="Redo"
          className="text-text-heading disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Redo />
        </Button>

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
      </div>

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
