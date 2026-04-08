"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { generationJobResultSchema } from "@/contracts/generation";
import { useEditor } from "@/context/EditorContext";
import { useJob } from "@/hooks/useGeneration";
import { useToast } from "@/hooks/useToast";
import Button from "@/app/_components/ui/Button";

type PreviewSourceOption = {
  id: string;
  label: string;
  url: string;
};

export default function GeneratedPreviewPanel() {
  const {
    generationJobId,
    playbackSourceKind,
    setGeneratedPlaybackSource,
    playGeneratedSource,
    playOriginalSource,
    openGenerateDialog,
  } = useEditor();
  const { toast } = useToast();
  const jobQuery = useJob(generationJobId);
  const activeJob = jobQuery.data ?? null;
  const generationResult = activeJob?.result
    ? generationJobResultSchema.safeParse(activeJob.result)
    : null;
  const parsedGenerationResult = generationResult?.success
    ? generationResult.data
    : null;
  const hlsPackage = parsedGenerationResult?.hlsPackage ?? null;
  const sourceOptions = useMemo<PreviewSourceOption[]>(
    () =>
      hlsPackage
        ? [
            {
              id: "adaptive",
              label: "Adaptive",
              url: hlsPackage.masterPlaylist.url,
            },
            ...hlsPackage.variants.map((variant) => ({
              id: variant.name,
              label: variant.name,
              url: variant.playlist.url,
            })),
          ]
        : [],
    [hlsPackage],
  );
  const [selectedSourceId, setSelectedSourceId] = useState("adaptive");
  const lastAnnouncedStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeJob) {
      lastAnnouncedStatusRef.current = null;
      return;
    }

    const nextStatusKey = `${activeJob.id}:${activeJob.status}`;
    if (lastAnnouncedStatusRef.current === null) {
      lastAnnouncedStatusRef.current = nextStatusKey;
      return;
    }

    if (lastAnnouncedStatusRef.current === nextStatusKey) {
      return;
    }

    if (activeJob.status === "COMPLETED") {
      toast("Final video is ready");
    } else if (activeJob.status === "FAILED") {
      toast(activeJob.error ?? "Final video generation failed", "error");
    }

    lastAnnouncedStatusRef.current = nextStatusKey;
  }, [activeJob, toast]);

  if (!generationJobId) {
    return null;
  }

  if (jobQuery.isLoading && !activeJob) {
    return (
      <div className="rounded-ad-markers border border-border-default bg-surface p-content-p-sm text-sm text-text-muted">
        Checking the latest generation status...
      </div>
    );
  }

  if (jobQuery.isError) {
    return (
      <div className="rounded-ad-markers border border-danger/30 bg-notification-badge/5 px-4 py-3 text-sm text-text-danger">
        <div className="flex flex-col gap-content-gap-sm lg:flex-row lg:items-center lg:justify-between">
          <p>
            {jobQuery.error instanceof Error
              ? jobQuery.error.message
              : "Failed to load the latest generation status"}
          </p>
          <Button variant="outline" onClick={openGenerateDialog}>
            Open render dialog
          </Button>
        </div>
      </div>
    );
  }

  if (!activeJob) {
    return null;
  }

  if (activeJob.status === "QUEUED" || activeJob.status === "PROCESSING") {
    return (
      <div className="rounded-ad-markers border border-border-default bg-background-page px-4 py-3 text-sm">
        <div className="flex flex-col gap-content-gap-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-background-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-text-on-primary">
                Rendering
              </span>
              <p className="font-semibold text-text-heading">
                Final video generation is running in the background.
              </p>
            </div>
            <p className="text-text-muted">
              You can keep editing, switch pages, or come back later. This
              editor will restore the latest render status for this episode.
            </p>
          </div>

          <div className="flex min-w-[220px] flex-col gap-3 lg:items-end">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {activeJob.status}
              </span>
              <span className="rounded-full bg-trend-positive/10 px-3 py-1 text-lg font-bold text-trend-positive">
                {activeJob.progress}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-trend-positive/20">
              <div
                className="h-full rounded-full bg-trend-positive transition-[width] duration-500"
                style={{ width: `${activeJob.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeJob.status === "FAILED") {
    return (
      <div className="rounded-ad-markers border border-danger/30 bg-notification-badge/5 px-4 py-3 text-sm text-text-danger">
        <div className="flex flex-col gap-content-gap-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-danger px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                Failed
              </span>
              <p className="font-semibold text-danger">
                Final video generation did not finish successfully.
              </p>
            </div>
            <p>{activeJob.error ?? "Please try generating the video again."}</p>
          </div>
          <Button variant="outline" onClick={openGenerateDialog}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const selectedSource =
    sourceOptions.find((option) => option.id === selectedSourceId) ??
    sourceOptions[0];

  function handleSourceChange(nextSourceId: string) {
    setSelectedSourceId(nextSourceId);

    const nextSource = sourceOptions.find(
      (option) => option.id === nextSourceId,
    );
    if (!nextSource) {
      return;
    }

    setGeneratedPlaybackSource(nextSource.url);

    if (playbackSourceKind === "generated") {
      playGeneratedSource();
    }
  }

  function handlePlayGenerated() {
    if (!selectedSource) {
      return;
    }

    setGeneratedPlaybackSource(selectedSource.url);
    playGeneratedSource();
  }

  return (
    <div className="rounded-ad-markers border border-border-default bg-background-page px-4 py-3 text-sm">
      <div className="flex flex-col gap-content-gap-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-trend-positive px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Preview
            </span>
            <p className="font-semibold text-text-heading">
              Final video is ready for preview.
            </p>
          </div>
          <p className="text-text-muted">
            Switch the editor between the original upload and the generated HLS
            stream, or lock the preview to a specific rendition.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href={parsedGenerationResult?.storedFile.url ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-background-primary underline underline-offset-4 hover:text-text-muted"
            >
              Open generated MP4
            </Link>
            {hlsPackage ? (
              <Link
                href={hlsPackage.masterPlaylist.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-background-primary underline underline-offset-4 hover:text-text-muted"
              >
                Open HLS master playlist
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-content-gap-sm lg:items-end">
          {sourceOptions.length > 0 ? (
            <label className="flex items-center gap-3">
              <span className="font-semibold text-text-heading">Quality</span>
              <select
                value={selectedSource?.id ?? "adaptive"}
                onChange={(event) => handleSourceChange(event.target.value)}
                className="rounded-button-primary border border-border-default bg-surface px-3 py-2 text-sm font-medium text-text-heading outline-none transition-colors focus:border-background-primary"
              >
                {sourceOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="flex gap-content-gap-sm">
            <Button variant="outline" onClick={playOriginalSource}>
              Source
            </Button>
            <Button
              variant={
                playbackSourceKind === "generated" ? "primary" : "outline"
              }
              onClick={handlePlayGenerated}
              disabled={!selectedSource}
            >
              Generated HLS
            </Button>
            <Button variant="outline" onClick={openGenerateDialog}>
              Regenerate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
