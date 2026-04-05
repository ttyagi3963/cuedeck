"use client";

import {
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { formatTime } from "@/utils/time";

type ProgressSliderProps = {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onHover?: (time: number, percent: number) => void;
  onHoverEnd?: () => void;
};

export default function ProgressSlider({
  currentTime,
  duration,
  onSeek,
  onHover,
  onHoverEnd,
}: ProgressSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);

  const displayTime = isDragging ? dragTime : currentTime;
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0;

  function getTimeFromEvent(e: MouseEvent | ReactMouseEvent) {
    const track = trackRef.current;
    if (!track || duration <= 0) return 0;

    const rect = track.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    return ratio * duration;
  }

  function handlePointerDown(e: ReactPointerEvent) {
    e.preventDefault();
    const time = getTimeFromEvent(e);
    setIsDragging(true);
    setDragTime(time);
    onSeek(time);

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: ReactPointerEvent) {
    if (!isDragging) return;
    const time = getTimeFromEvent(e);
    setDragTime(time);
    onSeek(time);
  }

  function handlePointerUp() {
    if (!isDragging) return;
    setIsDragging(false);
  }

  function handleMouseMove(e: ReactMouseEvent) {
    if (isDragging) return;
    const track = trackRef.current;
    if (!track || duration <= 0) return;

    const rect = track.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    onHover?.(ratio * duration, ratio * 100);
  }

  function handleMouseLeave() {
    onHoverEnd?.();
  }

  return (
    <div className="flex items-center gap-3">
      <span className="min-w-[3.5rem] text-right text-sm font-semibold tabular-nums text-white/80">
        {formatTime(displayTime)}
      </span>

      <div
        ref={trackRef}
        className="group relative flex h-8 flex-1 cursor-pointer items-center"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Track background */}
        <div className="h-1.5 w-full rounded-full bg-border-subtle">
          {/* Filled portion */}
          <div
            className="h-full rounded-full bg-interactive-primary"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Thumb */}
        <div
          className="absolute h-4 w-4 -translate-x-1/2 rounded-full border-2 border-interactive-primary bg-surface shadow-sm transition-transform group-hover:scale-125"
          style={{ left: `${progress}%` }}
        />
      </div>

      <span className="min-w-[3.5rem] text-sm font-semibold tabular-nums text-white/80">
        {formatTime(duration)}
      </span>
    </div>
  );
}
