"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import type { Marker } from "@/contracts/marker";
import {
  useEditorMarkers,
  useEditorPlaybackControls,
  useEditorPlaybackCurrentTime,
  useEditorPlaybackDuration,
  useEditorPlaybackIsPlaying,
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
  type Segment,
} from "@/utils/waveutils";
import { fetchPeaks, fetchWaveformStatus } from "@/utils/waveformPeaks";
import { GripDots } from "@/app/_components/ui/icons";
import Spinner from "@/app/_components/ui/Spinner";
import { MARKER_TYPE_META } from "./markerUi";
import WaveformToolbar from "./WaveformToolbar";

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

const HALF_GAP_PX = SEGMENT_GAP_PX / 2;

type SegmentedTimelineProps = {
  duration: number;
  segments: Segment[];
  draggingMarkerId: string | null;
  dragTimeSec: number;
  pendingPosition: { markerId: string; timeSec: number } | null;
  onAdPointerDown: (
    markerId: string,
    timeSec: number,
    e: React.PointerEvent,
  ) => void;
};

type AdTileProps = {
  marker: Marker;
  isDragging: boolean;
  leftStyle: string;
  widthStyle: string;
  onPointerDown: (e: React.PointerEvent) => void;
};

// Pinning the thumbnail URL to the first one we see for a given ad.id keeps
// <video src> stable across marker-query refetches. Without this, every
// invalidation after moveMarker returns fresh signed R2 URLs, which React
// sees as a new src and reloads every ad thumbnail's video element.
const AdTile = memo(function AdTile({
  marker,
  isDragging,
  leftStyle,
  widthStyle,
  onPointerDown,
}: AdTileProps) {
  const meta = MARKER_TYPE_META[marker.type];
  const firstAd = marker.markerAds[0]?.ad;
  const stableVideoUrl = useMemo(
    () => firstAd?.videoUrl,
    // Deliberately key on ad.id — we want to lock the URL we first saw for
    // this ad and ignore later resignings of the same content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [firstAd?.id],
  );

  return (
    <div
      className={`pointer-events-auto absolute inset-y-0 overflow-hidden rounded-lg border-2 ${meta.waveformLineClass.replace("bg-", "border-")} ${meta.waveformRegionClass} ${isDragging ? "cursor-grabbing opacity-90 shadow-lg" : "cursor-grab"}`}
      style={{ left: leftStyle, width: widthStyle, minWidth: 8 }}
      onPointerDown={onPointerDown}
    >
      {stableVideoUrl && (
        <video
          src={stableVideoUrl}
          preload="metadata"
          muted
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
        />
      )}

      <div className="absolute inset-x-0 bottom-1 flex justify-center">
        <GripDots className="size-4 text-current opacity-60" />
      </div>

      <div className="absolute inset-x-0 top-1 flex justify-center">
        <span className={`rounded px-1 py-0.5 text-[9px] font-bold leading-none ${meta.badgeClass}`}>
          {meta.shortLabel}
        </span>
      </div>
    </div>
  );
});

const SegmentedTimeline = memo(function SegmentedTimeline({
  duration,
  segments,
  draggingMarkerId,
  dragTimeSec,
  pendingPosition,
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

        const marker = seg.marker;
        const isDragging = draggingMarkerId === marker.id;
        const pinnedTimeSec =
          pendingPosition && pendingPosition.markerId === marker.id
            ? pendingPosition.timeSec
            : null;
        const effectiveStartPct = isDragging
          ? (dragTimeSec / duration) * 100
          : pinnedTimeSec !== null
            ? (pinnedTimeSec / duration) * 100
            : seg.startPct;

        return (
          <AdTile
            key={marker.id}
            marker={marker}
            isDragging={isDragging}
            leftStyle={`calc(${effectiveStartPct}% + ${HALF_GAP_PX}px)`}
            widthStyle={`calc(${seg.widthPct}% - ${SEGMENT_GAP_PX}px)`}
            onPointerDown={(e) => {
              e.stopPropagation();
              onAdPointerDown(marker.id, marker.timeSec, e);
            }}
          />
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
  const { episode, seek: rawSeek, play, pause } = useEditorPlaybackControls();
  const currentTime = useEditorPlaybackCurrentTime();
  const duration = useEditorPlaybackDuration();
  const isPlaying = useEditorPlaybackIsPlaying();
  const isPlayingRef = useRef(isPlaying);
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

  type WaveformInit =
    | { kind: "loading" }
    | { kind: "pending"; status: "QUEUED" | "PROCESSING"; progress: number }
    | { kind: "ready"; waveformUrl: string }
    | { kind: "fallback" };

  const [zoom, setZoom] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [readySourceUrl, setReadySourceUrl] = useState<string | null>(null);
  const [init, setInit] = useState<WaveformInit>(() =>
    episode.waveformUrl
      ? { kind: "ready", waveformUrl: episode.waveformUrl }
      : { kind: "loading" },
  );
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const [dragTimeSec, setDragTimeSec] = useState(0);
  // Tracks a marker whose drag has ENDED but whose position hasn't yet
  // propagated through React Query's optimistic update. We keep rendering
  // it at `pendingPosition.timeSec` so the tile doesn't snap back to the
  // stale pre-drop position during the brief window before `markers` updates.
  const [pendingPosition, setPendingPosition] = useState<{
    markerId: string;
    timeSec: number;
  } | null>(null);

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
  const isPending = init.kind === "loading" || init.kind === "pending";
  const isWaveformLoading =
    isPending || readySourceUrl !== episode.sourceUrl;

  // The peaks-file duration and the video-element duration can differ by a
  // fraction of a second. If our wrap ends up even 1px narrower than
  // WaveSurfer's internal ceil(duration * minPxPerSec), WaveSurfer flags the
  // waveform as scrollable, enters its lazy-render path, and scroll events
  // that happen in OUR outer container never fire its shadow-DOM scroll
  // listener — so chunks past the initial viewport stay blank. An 8px buffer
  // absorbs rounding + any duration-source drift and keeps WaveSurfer in its
  // "render everything up front" path.
  const WIDTH_BUFFER_PX = 8;
  const trackWidth =
    viewportWidth > 0
      ? Math.max(
          viewportWidth,
          zoom > 0 && duration > 0
            ? Math.ceil(duration * zoom) + WIDTH_BUFFER_PX
            : viewportWidth,
        )
      : undefined;

  useEffect(() => {
    seekRef.current = seek;
  }, [seek]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Clear the post-drop pin once the markers query has caught up.
  useEffect(() => {
    if (!pendingPosition) return;
    const marker = markers.find((m) => m.id === pendingPosition.markerId);
    if (marker && Math.abs(marker.timeSec - pendingPosition.timeSec) < 1) {
      setPendingPosition(null);
    }
  }, [markers, pendingPosition]);

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
    if (episode.waveformUrl) {
      setInit({ kind: "ready", waveformUrl: episode.waveformUrl });
      return;
    }

    setInit({ kind: "loading" });
    const controller = new AbortController();
    let timerId: ReturnType<typeof setTimeout> | null = null;

    async function probe() {
      try {
        const res = await fetchWaveformStatus(episode.id, controller.signal);
        if (controller.signal.aborted) return;

        if (res.status === "READY" && res.waveformUrl) {
          setInit({ kind: "ready", waveformUrl: res.waveformUrl });
          return;
        }
        if (res.status === "QUEUED" || res.status === "PROCESSING") {
          setInit({
            kind: "pending",
            status: res.status,
            progress: res.progress,
          });
          timerId = setTimeout(probe, 2000);
          return;
        }
        setInit({ kind: "fallback" });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.warn("[Wave] waveform status fetch failed", error);
        setInit({ kind: "fallback" });
      }
    }

    probe();

    return () => {
      controller.abort();
      if (timerId !== null) clearTimeout(timerId);
    };
  }, [episode.id, episode.waveformUrl]);

  useEffect(() => {
    if (init.kind !== "ready" && init.kind !== "fallback") return;
    const container = waveContainerRef.current;
    if (!container) return;

    const baseOptions = {
      container,
      height: WAVE_HEIGHT,
      waveColor: WAVE_BAR_COLOR,
      progressColor: WAVE_BAR_COLOR,
      cursorColor: "transparent",
      cursorWidth: 0,
      barWidth: WAVE_BAR_WIDTH,
      barGap: WAVE_BAR_GAP,
      barRadius: WAVE_BAR_RADIUS,
      barAlign: "bottom" as const,
      normalize: true,
      interact: true,
      dragToSeek: { debounceTime: 0 },
      autoScroll: true,
      autoCenter: false,
      hideScrollbar: false,
    };

    let ws: WaveSurfer | null = null;
    const controller = new AbortController();

    function attach(instance: WaveSurfer) {
      instance.on("ready", () => setReadySourceUrl(episode.sourceUrl));
      instance.on("interaction", (nextTime: number) => seekRef.current(nextTime));
      wsRef.current = instance;
    }

    function createWithClientDecode() {
      return WaveSurfer.create({
        ...baseOptions,
        url: episode.sourceUrl,
        media: document.createElement("audio"),
      });
    }

    async function boot() {
      if (init.kind === "ready") {
        try {
          const parsed = await fetchPeaks(init.waveformUrl, controller.signal);
          if (controller.signal.aborted) return;

          const audio = document.createElement("audio");
          audio.src = episode.sourceUrl;
          audio.preload = "metadata";

          ws = WaveSurfer.create({
            ...baseOptions,
            peaks: [parsed.peaks],
            duration: parsed.durationSec,
            media: audio,
          });
        } catch (error) {
          if (controller.signal.aborted) return;
          console.warn(
            "[Wave] peaks fetch failed, falling back to client decode",
            error,
          );
          ws = createWithClientDecode();
        }
      } else {
        ws = createWithClientDecode();
      }

      if (controller.signal.aborted) {
        ws.destroy();
        return;
      }

      attach(ws);
    }

    boot();

    return () => {
      controller.abort();
      ws?.destroy();
      wsRef.current = null;
    };
  }, [
    episode.sourceUrl,
    init.kind,
    init.kind === "ready" ? init.waveformUrl : null,
  ]);

  const handleZoomChange = useCallback((nextZoom: number) => {
    setZoom(clampZoom(nextZoom));
  }, []);

  // Apply zoom AFTER the DOM has committed the new trackWidth. Otherwise
  // WaveSurfer computes layout against a stale container width, flags the
  // waveform as isScrollable, falls into its lazy-render path, and leaves
  // off-screen chunks blank until its internal ResizeObserver fires ~100ms
  // later. Running in an effect guarantees a correct single-pass render.
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || zoom <= 0) return;

    ws.zoom(zoom);

    const viewport = scrollViewportRef.current;
    if (!viewport || duration <= 0) return;
    const track = viewport.firstElementChild as HTMLElement | null;
    if (!track) return;

    const tw = track.scrollWidth;
    const playheadX = (currentTimeRef.current / duration) * tw;
    const scrollTarget = playheadX - viewport.clientWidth / 2;
    viewport.scrollLeft = Math.max(0, scrollTarget);
  }, [zoom, duration]);

  const handlePlayheadDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDraggingPlayhead(true);

      const track = scrollViewportRef.current
        ?.firstElementChild as HTMLElement | null;
      if (!track) return;

      // Pause for the duration of the drag so repeated seek() calls don't
      // race play() and pause() against each other on every pointermove.
      // Resume on release if we interrupted a playing session.
      const wasPlaying = isPlayingRef.current;
      if (wasPlaying) {
        pause();
      }

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
        if (wasPlaying) {
          play();
        }
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    },
    [duration, pause, play],
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
        const committed = Math.round(latestTime);
        // Pin the tile to the dropped position until the markers query
        // optimistic-updates. Without this the tile briefly renders at the
        // pre-drag position between pointerup and the React Query onMutate.
        setPendingPosition({ markerId, timeSec: committed });
        setDraggingMarkerId(null);
        moveMarker(markerId, committed);
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    },
    [duration, moveMarker],
  );

  return (
    <div className="flex min-w-0 w-full flex-col gap-content-gap-xs rounded-2xl border border-border-default bg-surface p-content-p-xs lg:p-content-p-sm">
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
              pendingPosition={pendingPosition}
              onAdPointerDown={handleAdPointerDown}
            />

            {isWaveformLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-fuchsia-300/85 backdrop-blur-[1px]">
                <div className="flex items-center gap-content-gap-md rounded-full border border-border-on-primary/60 bg-surface/80 px-4 py-2 shadow-sm">
                  <Spinner size="sm" />
                  <span className="text-sm font-semibold text-text-heading">
                    {init.kind === "pending" && init.status === "PROCESSING"
                      ? `Preparing waveform from your upload… ${init.progress}%`
                      : init.kind === "pending"
                        ? "Preparing waveform from your upload…"
                        : init.kind === "loading"
                          ? "Checking waveform…"
                          : "Building waveform…"}
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
