"use client";

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
      <div className=" border-t border-border-default bg-surface p-content-p-sm text-sm text-text-muted">
        Checking the latest generation status...
      </div>
    );
  }

  if (jobQuery.isError) {
    return (
      <div className="flex flex-col gap-content-gap-sm  border-t border-danger/30 bg-notification-badge/5 px-4 py-3 text-sm text-text-danger">
        <p>
          {jobQuery.error instanceof Error
            ? jobQuery.error.message
            : "Failed to load the latest generation status"}
        </p>
        <Button variant="outline" onClick={openGenerateDialog}>
          Open render dialog
        </Button>
      </div>
    );
  }

  if (!activeJob) {
    return null;
  }

  if (activeJob.status === "QUEUED" || activeJob.status === "PROCESSING") {
    return (
      <div className="flex flex-col gap-content-gap-sm border-t border-border-default bg-background-page px-4 py-3 text-sm">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-background-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-text-on-primary">
            Rendering
          </span>
          <span className="font-semibold text-text-heading">
            Final video generation is running in the background.
          </span>
        </div>
        <p className="text-text-muted">
          You can keep editing, switch pages, or come back later. This editor
          will restore the latest render status for this episode.
        </p>
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
    );
  }

  if (activeJob.status === "FAILED") {
    return (
      <div className="flex flex-col gap-content-gap-sm rounded-ad-markers border border-danger/30 bg-notification-badge/5 px-4 py-3 text-sm text-text-danger">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-danger px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            Failed
          </span>
          <p className="font-semibold text-danger">
            Final video generation did not finish successfully.
          </p>
        </div>
        <p>{activeJob.error ?? "Please try generating the video again."}</p>
        <Button variant="outline" onClick={openGenerateDialog}>
          Try again
        </Button>
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

  return (
    <div className="flex flex-col gap-content-gap-sm rounded-b-ad-markers border-t border-border-default px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        <p className="rounded-full bg-trend-positive px-3 py-1 text-xs font-bold uppercase tracking-wider text-text-on-primary">
          Preview
        </p>
        <p className="font-semibold text-text-heading">
          Final video is ready for preview.
        </p>
      </div>

      <div className="flex items-center gap-content-gap-sm">
        {sourceOptions.length > 0 ? (
          <label className="flex items-center gap-content-gap-xs">
            <p className="text-xs font-semibold text-text-heading">Quality</p>
            <select
              value={selectedSource?.id ?? "adaptive"}
              onChange={(event) => handleSourceChange(event.target.value)}
              className="rounded-button-primary border border-border-default bg-surface px-2 py-1 text-xs font-medium text-text-heading outline-none transition-colors focus:border-background-primary capitalize"
            >
              {sourceOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="flex items-center gap-content-gap-xs">
          <p className="text-xs font-semibold text-text-heading">Download</p>
          <select
            defaultValue=""
            style={{ width: 120 }}
            onChange={(event) => {
              const url = event.target.value;
              if (url) {
                window.open(url, "_blank", "noreferrer");
                event.target.value = "";
              }
            }}
            className="rounded-button-primary border border-border-default bg-surface px-2 py-1 text-xs font-medium text-text-heading outline-none transition-colors focus:border-background-primary capitalize"
          >
            <option value="" disabled>
              Select format
            </option>
            {hlsPackage ? (
              <option value={hlsPackage.masterPlaylist.url}>
                Stitched HLS: Original quality
              </option>
            ) : null}
            <option value={parsedGenerationResult?.storedFile.url ?? ""}>
              Stitched MP4: Original quality
            </option>
            {hlsPackage?.variants.map((variant) => (
              <option key={variant.name} value={variant.playlist.url}>
                HLS: {variant.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
