"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import type { Marker } from "@/contracts/marker";
import {
  useEditorMarkers,
  useEditorPlaybackControls,
  useEditorPlaybackCurrentTime,
  useEditorPlaybackDuration,
} from "@/context/EditorContext";
import {
  WAVE_BAR_COLOR,
  WAVE_BAR_GAP,
  WAVE_BAR_RADIUS,
  WAVE_BAR_WIDTH,
  WAVE_HEIGHT,
  WAVE_MAX_PX_PER_SEC,
  WAVE_MIN_PX_PER_SEC,
  WAVE_TOP_PADDING,
  SEGMENT_GAP_PX,
} from "@/lib/constants";
import { formatTimestamp } from "@/utils/time";
import {
  clampZoom,
  computeSegments,
  generateTicks,
  generateMiniTicks,
  getMarkerDisplayDuration,
  type Segment,
} from "@/utils/waveutils";
import { GripDots } from "@/app/_components/ui/icons";
import Spinner from "@/app/_components/ui/Spinner";
import { MARKER_TYPE_META } from "./markerUi";
import WaveformToolbar from "./WaveformToolbar";

type MarkerDecorationsProps = {
  duration: number;
  markers: Marker[];
};

type PlayheadOverlayProps = {
  displayTime: number;
  duration: number;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
};

type TimelineTicksProps = {
  duration: number;
  ticks: number[];
  miniTicks: number[];
};

const PLAYHEAD_EDGE_SAFE_INSET_PX = 2;
const PLAYHEAD_HANDLE_WIDTH_PX = 24;
const PLAYHEAD_HANDLE_HALF_WIDTH_PX = PLAYHEAD_HANDLE_WIDTH_PX / 2;

const MarkerBadges = memo(function MarkerBadges({
  duration,
  markers,
}: MarkerDecorationsProps) {
  if (duration <= 0) {
    return null;
  }

  return markers.map((marker) => {
    const leftPct = (marker.timeSec / duration) * 100;
    const meta = MARKER_TYPE_META[marker.type];

    return (
      <div key={marker.id}>
        <div
          className={`absolute top-1 z-20 -translate-x-1/2 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none whitespace-nowrap shadow-sm ${meta.badgeClass}`}
          style={{ left: `${leftPct}%` }}
        >
          {meta.shortLabel}
        </div>
      </div>
    );
  });
});

const HALF_GAP_PX = SEGMENT_GAP_PX / 2;

type SegmentedTimelineProps = {
  duration: number;
  segments: Segment[];
  draggingMarkerId: string | null;
  dragTimeSec: number;
  onAdPointerDown: (
    markerId: string,
    timeSec: number,
    e: React.PointerEvent,
  ) => void;
};

const SegmentedTimeline = memo(function SegmentedTimeline({
  duration,
  segments,
  draggingMarkerId,
  dragTimeSec,
  onAdPointerDown,
}: SegmentedTimelineProps) {
  if (duration <= 0 || segments.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[15]">
      {segments.map((seg, i) => {
        const isFirst = i === 0;
        const isLast = i === segments.length - 1;

        if (seg.kind === "episode") {
          // Episode segments: transparent with rounded edges and gap insets
          const roundedLeft = isFirst ? "rounded-l-lg" : "";
          const roundedRight = isLast ? "rounded-r-lg" : "";

          return (
            <div
              key={`ep-${i}`}
              className={`absolute inset-y-0 ${roundedLeft} ${roundedRight}`}
              style={{
                left: `calc(${seg.startPct}% + ${isFirst ? 0 : HALF_GAP_PX}px)`,
                width: `calc(${seg.widthPct}% - ${(isFirst ? 0 : HALF_GAP_PX) + (isLast ? 0 : HALF_GAP_PX)}px)`,
              }}
            />
          );
        }

        // Ad segment
        const marker = seg.marker;
        const meta = MARKER_TYPE_META[marker.type];
        const isDragging = draggingMarkerId === marker.id;
        const effectiveStartPct = isDragging
          ? (dragTimeSec / duration) * 100
          : seg.startPct;

        const firstAd = marker.markerAds[0]?.ad;

        return (
          <div
            key={marker.id}
            className={`pointer-events-auto absolute inset-y-0 overflow-hidden rounded-lg border-2 ${meta.waveformLineClass.replace("bg-", "border-")} ${meta.waveformRegionClass} ${isDragging ? "cursor-grabbing opacity-90 shadow-lg" : "cursor-grab"}`}
            style={{
              left: `calc(${effectiveStartPct}% + ${HALF_GAP_PX}px)`,
              width: `calc(${seg.widthPct}% - ${SEGMENT_GAP_PX}px)`,
              minWidth: 8,
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onAdPointerDown(marker.id, marker.timeSec, e);
            }}
          >
            {/* Ad thumbnail */}
            {firstAd && (
              <video
                src={firstAd.videoUrl}
                preload="metadata"
                muted
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
              />
            )}

            {/* Grip handle */}
            <div className="absolute inset-x-0 bottom-1 flex justify-center">
              <GripDots className="size-4 text-current opacity-60" />
            </div>

            {/* Marker type label */}
            <div className="absolute inset-x-0 top-1 flex justify-center">
              <span className={`rounded px-1 py-0.5 text-[9px] font-bold leading-none ${meta.badgeClass}`}>
                {meta.shortLabel}
              </span>
            </div>
          </div>
        );
      })}

    </div>
  );
});

const PlayheadOverlay = memo(function PlayheadOverlay({
  displayTime,
  duration,
  onPointerDown,
}: PlayheadOverlayProps) {
  if (duration <= 0) {
    return null;
  }

  const progress = Math.max(0, Math.min(displayTime / duration, 1));
  const left = `${progress * 100}%`;
  const handleLeft = `clamp(${PLAYHEAD_EDGE_SAFE_INSET_PX - 5}px, calc(${left} - ${PLAYHEAD_HANDLE_HALF_WIDTH_PX}px), calc(100% - ${PLAYHEAD_HANDLE_WIDTH_PX + PLAYHEAD_EDGE_SAFE_INSET_PX}px))`;
  const lineLeft = `clamp(${PLAYHEAD_EDGE_SAFE_INSET_PX + 2}px, ${left}, calc(100% - ${PLAYHEAD_EDGE_SAFE_INSET_PX}px))`;

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
        <div
          className="pointer-events-auto z-50 absolute -top-5 flex cursor-grab active:cursor-grabbing items-center justify-center rounded-button-primary border border-red-400 bg-notification-badge p-0.5 text-text-on-primary shadow-sm"
          style={{ left: handleLeft }}
          onPointerDown={onPointerDown}
        >
          <GripDots className="size-4" />
        </div>
      </div>

      <div
        className="pointer-events-none absolute z-20 w-0.5 -translate-x-1/2 bg-notification-badge shadow-[0_0_10px_rgba(239,68,68,0.45)]"
        style={{
          left: lineLeft,
          top: WAVE_TOP_PADDING,
          height: WAVE_HEIGHT,
        }}
      />
    </>
  );
});

const TimelineTicks = memo(function TimelineTicks({
  duration,
  ticks,
  miniTicks,
}: TimelineTicksProps) {
  if (duration <= 0) {
    return null;
  }

  return (
    <div className="relative mt-2 h-5">
      {miniTicks.map((tick) => {
        const pct = (tick / duration) * 100;
        return (
          <div
            key={`mini-${tick}`}
            className="absolute -translate-x-1/2"
            style={{ left: `${pct}%` }}
          >
            <div className="mx-auto h-1 w-px bg-border-subtle/50" />
          </div>
        );
      })}
      {ticks.map((tick) => {
        const pct = (tick / duration) * 100;
        return (
          <div
            key={tick}
            className="absolute -translate-x-1/2"
            style={{ left: `${pct}%` }}
          >
            <div className="mx-auto h-1.5 w-px bg-border-subtle" />
            <span className="block text-[10px] leading-none text-text-muted">
              {formatTimestamp(tick)}
            </span>
          </div>
        );
      })}
    </div>
  );
});

export default function WaveformTimeline() {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const waveContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const currentTimeRef = useRef(0);
  const { episode, seek: rawSeek } = useEditorPlaybackControls();
  const currentTime = useEditorPlaybackCurrentTime();
  const duration = useEditorPlaybackDuration();
  const { markers, canUndo, canRedo, undo, redo, resetAdChecks, moveMarker } =
    useEditorMarkers();
  const seek = useCallback(
    (time: number) => {
      if (time < currentTimeRef.current) {
        resetAdChecks(time);
      }
      rawSeek(time);
    },
    [rawSeek, resetAdChecks],
  );
  const seekRef = useRef(seek);

  const [zoom, setZoom] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [readySourceUrl, setReadySourceUrl] = useState<string | null>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const [dragTimeSec, setDragTimeSec] = useState(0);

  const segments = useMemo(
    () => computeSegments(markers, duration),
    [markers, duration],
  );

  const ticks = useMemo(() => {
    return duration > 0 ? generateTicks(duration) : [];
  }, [duration]);
  const miniTicks = useMemo(() => {
    return duration > 0 ? generateMiniTicks(duration) : [];
  }, [duration]);
  const displayTime = isDraggingPlayhead ? dragTime : currentTime;
  const isWaveformLoading = readySourceUrl !== episode.sourceUrl;
  const trackWidth =
    viewportWidth > 0
      ? Math.max(
          viewportWidth,
          zoom > 0 && duration > 0 ? duration * zoom : viewportWidth,
        )
      : undefined;

  useEffect(() => {
    seekRef.current = seek;
  }, [seek]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    function updateViewportWidth() {
      if (!viewport) return;
      setViewportWidth(viewport.clientWidth);
    }

    updateViewportWidth();

    const observer = new ResizeObserver(updateViewportWidth);
    observer.observe(viewport);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const container = waveContainerRef.current;
    if (!container) return;

    const ws = WaveSurfer.create({
      container,
      height: WAVE_HEIGHT,
      waveColor: WAVE_BAR_COLOR,
      progressColor: WAVE_BAR_COLOR,
      cursorColor: "transparent",
      cursorWidth: 0,
      barWidth: WAVE_BAR_WIDTH,
      barGap: WAVE_BAR_GAP,
      barRadius: WAVE_BAR_RADIUS,
      barAlign: "bottom",
      normalize: true,
      interact: true,
      dragToSeek: { debounceTime: 0 },
      autoScroll: true,
      autoCenter: false,
      hideScrollbar: false,

      url: episode.sourceUrl,
      media: document.createElement("audio"),
    });

    ws.on("ready", () => {
      setReadySourceUrl(episode.sourceUrl);
    });

    ws.on("interaction", (nextTime: number) => {
      seekRef.current(nextTime);
    });

    wsRef.current = ws;

    return () => {
      ws.destroy();
      wsRef.current = null;
    };
  }, [episode.sourceUrl]);

  const handleZoomChange = useCallback(
    (nextZoom: number) => {
      const clampedZoom = clampZoom(nextZoom);
      setZoom(clampedZoom);
      wsRef.current?.zoom(clampedZoom);

      // Scroll so the playhead stays centered in the viewport
      const viewport = scrollViewportRef.current;
      if (!viewport || duration <= 0) return;

      requestAnimationFrame(() => {
        const track = viewport.firstElementChild as HTMLElement | null;
        if (!track) return;
        const trackWidth = track.scrollWidth;
        const playheadX = (currentTimeRef.current / duration) * trackWidth;
        const scrollTarget = playheadX - viewport.clientWidth / 2;
        viewport.scrollLeft = Math.max(0, scrollTarget);
      });
    },
    [duration],
  );

  const handlePlayheadDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDraggingPlayhead(true);

      const track = scrollViewportRef.current
        ?.firstElementChild as HTMLElement | null;
      if (!track) return;

      let lastSeek = performance.now();
      let lastKnownTime = currentTimeRef.current;
      setDragTime(lastKnownTime);

      const onMove = (pointerEvent: PointerEvent) => {
        const rect = track.getBoundingClientRect();
        const x = Math.max(
          0,
          Math.min(pointerEvent.clientX - rect.left, rect.width),
        );
        lastKnownTime = (x / rect.width) * duration;
        setDragTime(lastKnownTime);

        const now = performance.now();
        if (now - lastSeek > 150) {
          lastSeek = now;
          seekRef.current(lastKnownTime);
        }
      };

      const onUp = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
        setIsDraggingPlayhead(false);
        seekRef.current(lastKnownTime);
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    },
    [duration],
  );

  const handleAdPointerDown = useCallback(
    (markerId: string, timeSec: number, e: React.PointerEvent) => {
      e.preventDefault();
      setDraggingMarkerId(markerId);
      setDragTimeSec(timeSec);

      const track = scrollViewportRef.current
        ?.firstElementChild as HTMLElement | null;
      if (!track) return;

      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);

      let latestTime = timeSec;

      const onMove = (pe: PointerEvent) => {
        const rect = track.getBoundingClientRect();
        const x = Math.max(0, Math.min(pe.clientX - rect.left, rect.width));
        latestTime = Math.max(0, Math.min((x / rect.width) * duration, duration));
        setDragTimeSec(latestTime);
      };

      const onUp = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
        setDraggingMarkerId(null);
        moveMarker(markerId, Math.round(latestTime));
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    },
    [duration, moveMarker],
  );

  return (
    <div className="flex min-w-0 w-full flex-col gap-content-gap-xs rounded-2xl border border-border-default bg-surface p-content-p-xs md:p-content-p-sm">
      <WaveformToolbar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        zoom={zoom}
        minZoom={WAVE_MIN_PX_PER_SEC}
        maxZoom={WAVE_MAX_PX_PER_SEC}
        onZoomChange={handleZoomChange}
      />

      <div
        ref={scrollViewportRef}
        className="w-full max-w-full overflow-x-auto pt-6 px-4"
      >
        <div
          className="relative min-w-full"
          style={trackWidth ? { width: `${trackWidth}px` } : undefined}
        >
          <PlayheadOverlay
            displayTime={displayTime}
            duration={duration}
            onPointerDown={handlePlayheadDrag}
          />

          <div
            className="relative z-0 overflow-hidden rounded-dialog border-4 border-black bg-fuchsia-300 shadow-inner"
            style={{
              height: WAVE_HEIGHT,
              marginTop: WAVE_TOP_PADDING,
            }}
          >
            <SegmentedTimeline
              duration={duration}
              segments={segments}
              draggingMarkerId={draggingMarkerId}
              dragTimeSec={dragTimeSec}
              onAdPointerDown={handleAdPointerDown}
            />

            {isWaveformLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-fuchsia-300/85 backdrop-blur-[1px]">
                <div className="flex items-center gap-content-gap-md rounded-full border border-border-on-primary/60 bg-surface/80  py-2 shadow-sm">
                  <Spinner size="sm" />
                  <span className="text-sm font-semibold text-text-heading">
                    Building waveform...
                  </span>
                </div>
              </div>
            )}
            <div
              ref={waveContainerRef}
              className="relative z-10 h-full w-full"
            />
          </div>

          <TimelineTicks duration={duration} ticks={ticks} miniTicks={miniTicks} />
        </div>
      </div>
    </div>
  );
}
