"use client";

import { Undo2, Redo2 } from "lucide-react";
import { MagnifyMinus, MagnifyPlus } from "@/app/_components/ui/icons";
import { formatTimestamp } from "@/utils/time";

type WaveformToolbarProps = {
  currentTime: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  onZoomChange: (zoom: number) => void;
};

const ZOOM_STEP = 10;

export default function WaveformToolbar({
  currentTime,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  minZoom,
  maxZoom,
  onZoomChange,
}: WaveformToolbarProps) {
  const canZoomOut = zoom > minZoom;
  const canZoomIn = zoom < maxZoom;

  return (
    <div className="flex items-center justify-between rounded-lg  bg-surface px-4 py-2">
      {/* Left: Undo / Redo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="flex size-8 items-center justify-center rounded-full border border-border-default text-text-muted transition-colors hover:text-text-heading disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="flex size-8 items-center justify-center rounded-full border border-border-default text-text-muted transition-colors hover:text-text-heading disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Redo"
        >
          <Redo2 size={16} />
        </button>
      </div>

      {/* Center: Current timestamp */}
      <span className="rounded-md border border-border-default px-3 py-1 text-base font-semibold leading-6 tabular-nums text-zinc-500">
        {formatTimestamp(currentTime)}
      </span>

      {/* Right: Zoom controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onZoomChange(zoom - ZOOM_STEP)}
          disabled={!canZoomOut}
          className="text-text-muted transition-colors hover:text-text-heading disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Zoom out"
        >
          <MagnifyMinus className="size-5" />
        </button>
        <input
          type="range"
          min={minZoom}
          max={maxZoom}
          step={1}
          value={zoom}
          onInput={(e) => onZoomChange(e.currentTarget.valueAsNumber)}
          className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-border-default accent-text-heading"
          aria-label="Zoom level"
        />
        <button
          type="button"
          onClick={() => onZoomChange(zoom + ZOOM_STEP)}
          disabled={!canZoomIn}
          className="text-text-muted transition-colors hover:text-text-heading disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Zoom in"
        >
          <MagnifyPlus className="size-5" />
        </button>
      </div>
    </div>
  );
}
