"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
} from "react";
import clsx from "clsx";
import type { TranscriptSegment } from "@/contracts/transcript";
import {
  useEditor,
  useEditorPlaybackCurrentTime,
} from "@/context/EditorContext";
import { useStartTranscription, useTranscriptPanel } from "@/hooks/useTranscript";
import { useToast } from "@/hooks/useToast";
import { formatTimestamp } from "@/utils/time";
import Button from "@/app/_components/ui/Button";

const EMPTY_SEGMENTS: TranscriptSegment[] = [];

export default function TranscriptPanel() {
  const {
    episode,
    seek,
    playbackSourceKind,
    playOriginalSource,
  } = useEditor();
  const currentTime = useEditorPlaybackCurrentTime();
  const deferredCurrentTime = useDeferredValue(currentTime);
  const { toast } = useToast();
  const transcriptQuery = useTranscriptPanel(episode.id);
  const startTranscriptionMutation = useStartTranscription(episode.id);
  const segmentRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const lastScrolledSegmentIdRef = useRef<string | null>(null);

  const panelState = transcriptQuery.data ?? null;
  const segments = panelState?.segments ?? EMPTY_SEGMENTS;
  const latestJob = panelState?.latestJob ?? null;
  const isProcessing =
    latestJob?.status === "QUEUED" || latestJob?.status === "PROCESSING";
  const hasTranscript = segments.length > 0;

  const activeSegmentId = useMemo(() => {
    if (playbackSourceKind !== "source") {
      return null;
    }

    const activeSegment = segments.find(
      (segment) =>
        deferredCurrentTime >= segment.startTime &&
        deferredCurrentTime < segment.endTime,
    );

    if (activeSegment) {
      return activeSegment.id;
    }

    return segments.findLast((segment) => deferredCurrentTime >= segment.startTime)
      ?.id ?? null;
  }, [segments, deferredCurrentTime, playbackSourceKind]);

  useEffect(() => {
    if (!activeSegmentId || lastScrolledSegmentIdRef.current === activeSegmentId) {
      return;
    }

    lastScrolledSegmentIdRef.current = activeSegmentId;
    segmentRefs.current.get(activeSegmentId)?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeSegmentId]);

  async function handleStartTranscription() {
    try {
      const result = await startTranscriptionMutation.mutateAsync();
      const startedMessage =
        result.job.status === "QUEUED" || result.job.status === "PROCESSING"
          ? "Transcript generation started"
          : "Transcript job is already running";
      toast(startedMessage);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start transcription";
      toast(message, "error");
    }
  }

  function handleSeekToSegment(startTime: number) {
    if (playbackSourceKind === "generated") {
      playOriginalSource();
    }

    seek(startTime);
  }

  return (
    <section className="flex min-w-0 flex-col gap-content-gap-sm rounded-ad-markers border border-border-default bg-surface p-content-p-xs md:p-content-p-sm">
      <div className="flex flex-col gap-content-gap-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-content-gap-xxs">
          <div className="flex items-center gap-content-gap-sm">
            <h2 className="text-base font-bold text-text-heading">Transcript</h2>
            {hasTranscript && (
              <span className="rounded-full bg-background-page px-3 py-1 text-xs font-semibold text-text-muted">
                {segments.length} {segments.length === 1 ? "segment" : "segments"}
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted">
            Click any segment to jump the player to that moment in the episode.
          </p>
        </div>

        {!isProcessing && (
          <Button
            variant={startTranscriptionMutation.isPending ? "disabled" : "outline"}
            onClick={handleStartTranscription}
            disabled={startTranscriptionMutation.isPending}
          >
            {startTranscriptionMutation.isPending
              ? "Starting..."
              : hasTranscript
                ? "Regenerate transcript"
                : "Generate transcript"}
          </Button>
        )}
      </div>

      {playbackSourceKind === "generated" && (
        <div className="rounded-dialog border border-border-default bg-background-page p-content-p-sm text-sm text-text-muted">
          Transcript timing follows the source episode. Click any segment below to
          switch back to the source player and scrub accurately.
        </div>
      )}

      {isProcessing && latestJob && (
        <div className="rounded-dialog border border-border-default bg-background-page p-content-p-sm text-sm text-text-muted">
          <div className="flex items-center justify-between gap-content-gap-sm">
            <div className="flex flex-col gap-content-gap-xxs">
              <p className="font-semibold text-text-heading">Transcribing audio</p>
              <p>You can keep editing markers while the transcript cooks.</p>
            </div>
            <span className="rounded-full bg-trend-positive/10 px-3 py-1 text-base font-bold text-trend-positive">
              {latestJob.progress}%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-trend-positive/20">
            <div
              className="h-full rounded-full bg-trend-positive transition-[width] duration-500"
              style={{ width: `${latestJob.progress}%` }}
            />
          </div>
        </div>
      )}

      {latestJob?.status === "FAILED" && (
        <div className="rounded-dialog border border-border-default bg-background-page p-content-p-sm text-sm text-text-danger">
          <p className="font-semibold text-text-danger-strong">Transcript generation failed</p>
          <p className="mt-2">{latestJob.error ?? "Unknown transcription error"}</p>
        </div>
      )}

      {transcriptQuery.isLoading && !panelState && (
        <div className="rounded-dialog border border-border-default bg-background-page p-content-p-sm text-sm text-text-muted">
          Loading transcript...
        </div>
      )}

      {transcriptQuery.isError && !panelState && (
        <div className="rounded-dialog border border-border-default bg-background-page p-content-p-sm text-sm text-text-danger">
          {transcriptQuery.error instanceof Error
            ? transcriptQuery.error.message
            : "Failed to load transcript"}
        </div>
      )}

      {!hasTranscript && !isProcessing && !transcriptQuery.isLoading && !transcriptQuery.isError && (
        <div className="rounded-dialog border border-dashed border-border-default bg-background-page p-content-p-sm text-sm text-text-muted">
          Generate a transcript to turn the spoken content into a clickable
          scrubbing rail for this episode.
        </div>
      )}

      {hasTranscript && (
        <div className="max-h-[320px] overflow-y-auto rounded-dialog border border-border-default bg-background-page">
          <div className="flex flex-col">
            {segments.map((segment) => {
              const isActive = segment.id === activeSegmentId;

              return (
                <button
                  key={segment.id}
                  type="button"
                  ref={(node) => {
                    if (node) {
                      segmentRefs.current.set(segment.id, node);
                    } else {
                      segmentRefs.current.delete(segment.id);
                    }
                  }}
                  onClick={() => handleSeekToSegment(segment.startTime)}
                  className={clsx(
                    "flex w-full items-start gap-content-gap-sm border-b border-border-default px-4 py-3 text-left transition-colors last:border-b-0",
                    isActive
                      ? "bg-trend-positive/10"
                      : "hover:bg-surface",
                  )}
                >
                  <span
                    className={clsx(
                      "shrink-0 rounded-full px-2 py-1 font-mono text-xs font-semibold",
                      isActive
                        ? "bg-trend-positive text-text-on-primary"
                        : "bg-surface text-text-muted",
                    )}
                  >
                    {formatTimestamp(segment.startTime)}
                  </span>
                  <span
                    className={clsx(
                      "text-sm leading-6",
                      isActive ? "text-text-heading" : "text-text-muted",
                    )}
                  >
                    {segment.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
