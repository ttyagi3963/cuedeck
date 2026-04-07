"use client";

import {
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { formatTime } from "@/utils/time";
import type { Marker } from "@/contracts/marker";

type ProgressSliderProps = {
  currentTime: number;
  duration: number;
  markers?: Marker[];
  onSeek: (time: number) => void;
  onMarkerDrag?: (markerId: string, newTimeSec: number) => void;
  onHover?: (time: number, percent: number) => void;
  onHoverEnd?: () => void;
};

export default function ProgressSlider({
  currentTime,
  duration,
  markers = [],
  onSeek,
  onMarkerDrag,
  onHover,
  onHoverEnd,
}: ProgressSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const lastSeekRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);

  // Marker-drag state
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const [markerDragTime, setMarkerDragTime] = useState(0);

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

  function getPercentFromEvent(e: MouseEvent | ReactMouseEvent) {
    const track = trackRef.current;
    if (!track || duration <= 0) return 0;

    const rect = track.getBoundingClientRect();
    return Math.max(
      0,
      Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
    );
  }

  function handlePointerDown(e: ReactPointerEvent) {
    // Don't start playhead drag if we're dragging a marker
    if (draggingMarkerId) return;
    e.preventDefault();
    const time = getTimeFromEvent(e);
    const percent = getPercentFromEvent(e);
    setIsDragging(true);
    setDragTime(time);
    onSeek(time);
    onHover?.(time, percent);

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: ReactPointerEvent) {
    // Marker drag takes priority
    if (draggingMarkerId) {
      const time = getTimeFromEvent(e);
      setMarkerDragTime(Math.max(0, Math.min(duration, time)));
      return;
    }

    if (!isDragging) return;
    const time = getTimeFromEvent(e);
    const percent = getPercentFromEvent(e);
    setDragTime(time);
    onHover?.(time, percent);

    // Throttle actual video seeks to avoid overwhelming the decoder
    const now = performance.now();
    if (now - lastSeekRef.current > 150) {
      lastSeekRef.current = now;
      onSeek(time);
    }
  }

  function handlePointerUp() {
    // Finish marker drag
    if (draggingMarkerId) {
      onMarkerDrag?.(draggingMarkerId, Math.round(markerDragTime));
      setDraggingMarkerId(null);
      return;
    }

    if (!isDragging) return;
    setIsDragging(false);
    onSeek(dragTime);
    onHoverEnd?.();
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
            className="h-full rounded-full bg-red-600"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Ad marker indicators */}
        {duration > 0 &&
          markers.map((m) => {
            const adNames = m.markerAds.map((ma) => ma.ad.title).join(", ");
            const label = adNames || `${m.type} marker`;
            const isHovered = hoveredMarkerId === m.id;
            const isBeingDragged = draggingMarkerId === m.id;
            const displayTimeSec = isBeingDragged ? markerDragTime : m.timeSec;
            const leftPercent = (displayTimeSec / duration) * 100;

            return (
              <div
                key={m.id}
                className={`absolute top-1/2 z-[2] -translate-y-1/2 ${onMarkerDrag ? "cursor-grab" : ""} ${isBeingDragged ? "cursor-grabbing" : ""}`}
                style={{ left: `${leftPercent}%` }}
                onMouseEnter={() =>
                  !draggingMarkerId && setHoveredMarkerId(m.id)
                }
                onMouseLeave={() => setHoveredMarkerId(null)}
                onPointerDown={(e) => {
                  if (!onMarkerDrag) return;
                  e.preventDefault();
                  e.stopPropagation();
                  setDraggingMarkerId(m.id);
                  setMarkerDragTime(m.timeSec);
                  setHoveredMarkerId(null);

                  // Capture pointer on the track so movements outside the dot still work
                  trackRef.current?.setPointerCapture(e.pointerId);
                }}
              >
                {/* Yellow tick */}
                <div
                  className={`h-[6px] w-[6px] bg-yellow-700 transition-[left] duration-300 ${isBeingDragged ? "scale-150 bg-yellow-300" : ""}`}
                />

                {/* Drag tooltip - shows time while dragging */}
                {isBeingDragged && (
                  <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-yellow-500 px-2.5 py-1 text-xs font-bold text-black shadow-lg">
                    {formatTime(markerDragTime)}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-yellow-500" />
                  </div>
                )}

                {/* Hover tooltip */}
                {isHovered && !draggingMarkerId && (
                  <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-800 px-2.5 py-1 text-xs font-medium text-white shadow-lg animate-in fade-in">
                    {label}
                    <span className="ml-1.5 text-white/50">
                      {formatTime(m.timeSec)}
                    </span>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800" />
                  </div>
                )}
              </div>
            );
          })}

        {/* Thumb */}
        <div
          className="absolute z-[3] h-4 w-4 -translate-x-1/2 rounded-full bg-red-600 shadow-sm transition-transform group-hover:scale-125"
          style={{ left: `${progress}%` }}
        />
      </div>

      <span className="min-w-[3.5rem] text-sm font-semibold tabular-nums text-white/80">
        {formatTime(duration)}
      </span>
    </div>
  );
}
