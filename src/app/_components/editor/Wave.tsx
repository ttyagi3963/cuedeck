"use client";

import { useRef, useEffect, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { useEditor } from "@/context/EditorContext";
import { MARKER_TYPE_META } from "@/contracts/marker";
import {
  WAVE_BAR_COLOR,
  WAVE_BAR_GAP,
  WAVE_BAR_RADIUS,
  WAVE_BAR_WIDTH,
  WAVE_HEIGHT,
  WAVE_MAX_PX_PER_SEC,
  WAVE_MIN_PX_PER_SEC,
  WAVE_TOP_PADDING,
} from "@/lib/constants";
import { formatTimestamp } from "@/utils/time";
import {
  clampZoom,
  generateTicks,
  getMarkerDisplayDuration,
} from "@/utils/waveutils";
import { GripDots } from "@/app/_components/ui/icons";
import Spinner from "@/app/_components/ui/Spinner";
import WaveformToolbar from "./WaveformToolbar";

export default function WaveformTimeline() {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const waveContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);

  const { episode, playback, seek, markers, canUndo, canRedo, undo, redo } =
    useEditor();

  const seekRef = useRef(seek);

  const [zoom, setZoom] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [readySourceUrl, setReadySourceUrl] = useState<string | null>(null);

  const ticks = playback.duration > 0 ? generateTicks(playback.duration) : [];
  const isWaveformLoading = readySourceUrl !== episode.sourceUrl;
  const trackWidth =
    viewportWidth > 0
      ? Math.max(
          viewportWidth,
          zoom > 0 && playback.duration > 0
            ? playback.duration * zoom
            : viewportWidth,
        )
      : undefined;

  useEffect(() => {
    seekRef.current = seek;
  }, [seek]);

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

  // ---------------------------------------------------------------------------
  // WaveSurfer lifecycle
  // ---------------------------------------------------------------------------

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
      autoScroll: false,
      autoCenter: false,
      hideScrollbar: true,
      url: episode.sourceUrl,
      media: document.createElement("audio"),
    });

    ws.on("ready", () => {
      setReadySourceUrl(episode.sourceUrl);
    });

    ws.on("interaction", (newTime: number) => {
      seekRef.current(newTime);
    });

    wsRef.current = ws;

    return () => {
      ws.destroy();
      wsRef.current = null;
    };
  }, [episode.sourceUrl]);

  // ---------------------------------------------------------------------------
  // Zoom
  // ---------------------------------------------------------------------------

  function handleZoomChange(nextZoom: number) {
    const clampedZoom = clampZoom(nextZoom);
    setZoom(clampedZoom);
    wsRef.current?.zoom(clampedZoom);
  }

  function handlePlayheadDrag(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    const track = scrollViewportRef.current
      ?.firstElementChild as HTMLElement | null;
    if (!track) return;

    let lastSeek = performance.now();
    let lastKnownTime = playback.currentTime;
    const duration = playback.duration;

    const onMove = (ev: PointerEvent) => {
      const rect = track.getBoundingClientRect();
      const x = Math.max(0, Math.min(ev.clientX - rect.left, rect.width));
      lastKnownTime = (x / rect.width) * duration;

      const now = performance.now();
      // Throttle actual video seeks to avoid overwhelming the decoder
      if (now - lastSeek > 150) {
        lastSeek = now;
        seekRef.current(lastKnownTime);
      }
    };

    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);

      // Ensure the playhead lands exactly where the user dropped it
      seekRef.current(lastKnownTime);
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  }

  return (
    <div className="flex min-w-0 w-full flex-col gap-2 rounded-2xl border border-border-default bg-surface p-4">
      <WaveformToolbar
        currentTime={playback.currentTime}
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
        className="w-full max-w-full overflow-x-auto"
      >
        <div
          className="relative min-w-full"
          style={trackWidth ? { width: `${trackWidth}px` } : undefined}
        >
          {playback.duration > 0 && (
            <div
              className="pointer-events-none absolute top-0 z-30 -translate-x-1/2"
              style={{
                left: `${(playback.currentTime / playback.duration) * 100}%`,
              }}
            >
              <div
                className="pointer-events-auto z-50 absolute left-1/2 -top-5 flex -translate-x-1/2 cursor-grab active:cursor-grabbing items-center justify-center rounded-md border border-red-400 bg-red-500 p-0.5 text-white shadow-sm"
                onPointerDown={handlePlayheadDrag}
              >
                <GripDots className="size-4" />
              </div>
            </div>
          )}

          {playback.duration > 0 &&
            markers.map((marker) => {
              const leftPct = (marker.timeSec / playback.duration) * 100;
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
            })}

          <div
            className="relative z-0 overflow-hidden rounded-lg border-4 border-black bg-fuchsia-300 shadow-inner"
            style={{
              height: WAVE_HEIGHT,
              marginTop: WAVE_TOP_PADDING,
            }}
          >
            <div className="pointer-events-none absolute inset-0 z-0">
              {playback.duration > 0 &&
                markers.map((marker) => {
                  const leftPct = (marker.timeSec / playback.duration) * 100;
                  const meta = MARKER_TYPE_META[marker.type];
                  const displayDuration = getMarkerDisplayDuration(marker);
                  const widthPct =
                    displayDuration > 0
                      ? (displayDuration / playback.duration) * 100
                      : 0;

                  return (
                    <div key={`${marker.id}-wave-overlay`}>
                      {widthPct > 0 && (
                        <div
                          className={`absolute inset-y-0 rounded-md opacity-80 ${meta.waveformRegionClass}`}
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            minWidth: 8,
                          }}
                        />
                      )}

                      <div
                        className={`absolute inset-y-0 w-0.5 ${meta.waveformLineClass}`}
                        style={{ left: `${leftPct}%` }}
                      />
                    </div>
                  );
                })}
            </div>

            {playback.duration > 0 && (
              <div
                className="pointer-events-none absolute inset-y-0 z-20 w-0.5 -translate-x-1/2 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.45)]"
                style={{
                  left: `${(playback.currentTime / playback.duration) * 100}%`,
                }}
              />
            )}

            {isWaveformLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-fuchsia-300/85 backdrop-blur-[1px]">
                <div className="flex items-center gap-3 rounded-full border border-white/60 bg-white/80  py-2 shadow-sm">
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

          {playback.duration > 0 && (
            <div className="relative mt-2 h-5">
              {ticks.map((t) => {
                const pct = (t / playback.duration) * 100;
                return (
                  <div
                    key={t}
                    className="absolute -translate-x-1/2"
                    style={{ left: `${pct}%` }}
                  >
                    <div className="mx-auto h-1.5 w-px bg-border-subtle" />
                    <span className="block text-[10px] leading-none text-text-muted">
                      {formatTimestamp(t)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
