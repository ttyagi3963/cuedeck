"use client";

import { useEditor } from "@/context/EditorContext";
import Dialog from "@/app/_components/ui/Dialog";
import Button from "@/app/_components/ui/Button";
import { useJob, useStartGeneration } from "@/hooks/useGeneration";
import { useToast } from "@/hooks/useToast";

type GenerateEpisodeDialogProps = {
  open: boolean;
  onClose: () => void;
  episodeId: string;
  episodeTitle: string;
  markerCount: number;
  jobId: string | null;
  onJobCreated: (jobId: string) => void;
};

export default function GenerateEpisodeDialog({
  open,
  onClose,
  episodeId,
  episodeTitle,
  markerCount,
  jobId,
  onJobCreated,
}: GenerateEpisodeDialogProps) {
  const startGenerationMutation = useStartGeneration(episodeId);
  const jobQuery = useJob(jobId);
  const { toast } = useToast();
  const { playOriginalSource } = useEditor();
  const hasMarkers = markerCount > 0;
  const activeJob = jobQuery.data ?? null;
  const hasKnownJob = jobId !== null;
  const isCheckingLatestJob = hasKnownJob && jobQuery.isLoading && !activeJob;
  const isProcessing =
    activeJob?.status === "QUEUED" || activeJob?.status === "PROCESSING";

  function handleClose() {
    if (startGenerationMutation.isPending) {
      return;
    }

    onClose();
  }

  async function handleConfirm() {
    try {
      const result = await startGenerationMutation.mutateAsync();
      const insertionCount = result.plan.insertions.length;
      onJobCreated(result.job.id);
      playOriginalSource();
      onClose();
      toast(
        `Generation started for "${episodeTitle}". You can keep editing while ${insertionCount === 0 ? "the render runs" : `${insertionCount} ${insertionCount === 1 ? "ad break is" : "ad breaks are"} rendered`}.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start generation";
      toast(message, "error");
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={
        isProcessing ? "Generation running in background" : "Generate final video?"
      }
      subtitle={
        isProcessing
          ? `A render for "${episodeTitle}" is already in progress. You can close this dialog and keep editing while it finishes.`
          : `This will create a rendered MP4 and HLS package for "${episodeTitle}" using the current marker and ad selections.`
      }
      dismissible={!startGenerationMutation.isPending}
    >
      {isCheckingLatestJob ? (
        <div className="flex flex-col gap-content-gap-sm">
          <div className="rounded-dialog border border-border-default bg-surface p-content-p-sm text-sm text-text-muted">
            Checking the latest generation status...
          </div>
          <Button
            variant="primary"
            className="w-full"
            onClick={handleClose}
            disabled={startGenerationMutation.isPending}
          >
            Close
          </Button>
        </div>
      ) : isProcessing ? (
        <div className="flex flex-col gap-content-gap-sm">
          <div className="rounded-dialog border border-border-default bg-surface p-content-p-sm text-sm text-text-muted">
            <p>
              Status:{" "}
              <span className="font-semibold text-text-heading">
                {activeJob.status}
              </span>
            </p>
            <div className="mt-3 flex items-center justify-between gap-content-gap-sm">
              <span className="text-sm font-medium text-text-muted">
                Progress
              </span>
              <span className="rounded-full bg-trend-positive/10 px-3 py-1 text-lg font-bold text-trend-positive">
                {activeJob.progress}%
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-trend-positive/20">
              <div
                className="h-full rounded-full bg-trend-positive transition-[width] duration-500"
                style={{ width: `${activeJob.progress}%` }}
              />
            </div>
            <p className="mt-3">
              You can close this dialog, keep editing, or leave the page and come
              back later.
            </p>
            {activeJob.error ? (
              <p className="mt-2 text-text-danger">{activeJob.error}</p>
            ) : null}
          </div>

          <Button
            variant="primary"
            className="w-full"
            onClick={handleClose}
            disabled={startGenerationMutation.isPending}
          >
            Keep editing
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-content-gap-sm">
          <div className="rounded-dialog border border-border-default bg-surface p-content-p-sm text-sm text-text-muted">
            <p>
              {markerCount} {markerCount === 1 ? "marker" : "markers"} will be
              used for this render.
            </p>
            {!hasMarkers ? (
              <p className="mt-2 text-text-danger">
                Add at least one marker before generating a final video.
              </p>
            ) : null}
            {activeJob?.status === "COMPLETED" ? (
              <p className="mt-2 text-trend-positive">
                A previous render is already complete. Starting again will create a
                fresh output from the current markers.
              </p>
            ) : null}
            {activeJob?.status === "FAILED" ? (
              <p className="mt-2 text-text-danger">
                The previous render failed. You can start a new one from the current
                editor state.
              </p>
            ) : null}
          </div>

          {jobQuery.isError ? (
            <div className="rounded-dialog border border-text-danger/30 bg-text-danger/5 p-content-p-sm text-sm text-text-danger">
              {jobQuery.error instanceof Error
                ? jobQuery.error.message
                : "Failed to fetch the latest generation status"}
            </div>
          ) : null}

          <div className="flex gap-content-gap-sm">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={startGenerationMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant={
                !hasMarkers || startGenerationMutation.isPending
                  ? "disabled"
                  : "primary"
              }
              className="flex-1"
              onClick={handleConfirm}
              disabled={
                !hasMarkers ||
                startGenerationMutation.isPending ||
                isCheckingLatestJob
              }
            >
              {startGenerationMutation.isPending
                ? "Starting..."
                : "Generate video"}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
