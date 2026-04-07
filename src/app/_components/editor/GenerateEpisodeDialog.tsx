"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { generationJobResultSchema } from "@/contracts/generation";
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
  onJobCleared: () => void;
};

export default function GenerateEpisodeDialog({
  open,
  onClose,
  episodeId,
  episodeTitle,
  markerCount,
  jobId,
  onJobCreated,
  onJobCleared,
}: GenerateEpisodeDialogProps) {
  const startGenerationMutation = useStartGeneration(episodeId);
  const jobQuery = useJob(jobId);
  const { toast } = useToast();
  const hasMarkers = markerCount > 0;
  const statusToastRef = useRef<string | null>(null);
  const activeJob = jobQuery.data ?? null;
  const generationResult = activeJob?.result
    ? generationJobResultSchema.safeParse(activeJob.result)
    : null;
  const parsedGenerationResult = generationResult?.success
    ? generationResult.data
    : null;

  useEffect(() => {
    if (!activeJob) {
      statusToastRef.current = null;
      return;
    }

    const statusKey = `${activeJob.id}:${activeJob.status}`;
    if (statusToastRef.current === statusKey) {
      return;
    }

    if (activeJob.status === "COMPLETED") {
      toast("Final video is ready");
      statusToastRef.current = statusKey;
    } else if (activeJob.status === "FAILED") {
      toast(activeJob.error ?? "Generation failed", "error");
      statusToastRef.current = statusKey;
    }
  }, [activeJob, toast]);

  function handleClose() {
    if (startGenerationMutation.isPending) {
      return;
    }

    onClose();
  }

  function handleReset() {
    onJobCleared();
  }

  async function handleConfirm() {
    try {
      const result = await startGenerationMutation.mutateAsync();
      const insertionCount = result.plan.insertions.length;
      onJobCreated(result.job.id);
      toast(
        `Generation started for "${episodeTitle}" with ${insertionCount} ${insertionCount === 1 ? "ad break" : "ad breaks"}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start generation";
      toast(message, "error");
    }
  }

  const dialogTitle = activeJob
    ? activeJob.status === "COMPLETED"
      ? "Final video ready"
      : activeJob.status === "FAILED"
        ? "Generation failed"
        : "Generating final video"
    : "Generate final video?";

  const dialogSubtitle = activeJob
    ? activeJob.status === "COMPLETED"
      ? `The rendered MP4 for "${episodeTitle}" is complete.`
      : activeJob.status === "FAILED"
        ? `The render for "${episodeTitle}" did not finish successfully.`
        : `Rendering "${episodeTitle}" into a final MP4 with ad insertions.`
    : `This will create a rendered MP4 for "${episodeTitle}" using the saved marker and ad selections.`;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={dialogTitle}
      subtitle={dialogSubtitle}
    >
      {!activeJob && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-border-default bg-surface p-4 text-sm text-text-muted">
            <p>
              {markerCount} {markerCount === 1 ? "marker" : "markers"} will be
              used for this render.
            </p>
            {!hasMarkers && (
              <p className="mt-2 text-text-danger">
                Add at least one marker before generating a final video.
              </p>
            )}
          </div>

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
              disabled={!hasMarkers || startGenerationMutation.isPending}
            >
              {startGenerationMutation.isPending
                ? "Starting..."
                : "Generate video"}
            </Button>
          </div>
        </div>
      )}

      {activeJob && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-border-default bg-surface p-4 text-sm text-text-muted">
            <p>
              Status: <span className="font-semibold text-text-heading">{activeJob.status}</span>
            </p>
            <p className="mt-2">
              Progress:{" "}
              <span className="font-semibold text-text-heading">
                {activeJob.progress}%
              </span>
            </p>
            {activeJob.error && (
              <p className="mt-2 text-text-danger">{activeJob.error}</p>
            )}
            {jobQuery.isLoading && (
              <p className="mt-2">Refreshing job status...</p>
            )}
            {jobQuery.isError && (
              <p className="mt-2 text-text-danger">
                {jobQuery.error instanceof Error
                  ? jobQuery.error.message
                  : "Failed to fetch job status"}
              </p>
            )}
          </div>

          {parsedGenerationResult && (
            <div className="rounded-lg border border-border-default bg-surface p-4 text-sm text-text-muted">
              <p>
                Output file:{" "}
                <span className="font-medium text-text-heading">
                  {parsedGenerationResult.storedFile.path}
                </span>
              </p>
              <p className="mt-2">
                Segments rendered:{" "}
                <span className="font-medium text-text-heading">
                  {parsedGenerationResult.segmentCount}
                </span>
              </p>
              <Link
                href={parsedGenerationResult.storedFile.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-sm font-medium text-interactive-primary hover:underline"
              >
                Open generated video
              </Link>
            </div>
          )}

          <div className="flex gap-content-gap-sm">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Close
            </Button>
            {(activeJob.status === "COMPLETED" || activeJob.status === "FAILED") && (
              <Button variant="primary" className="flex-1" onClick={handleReset}>
                {activeJob.status === "FAILED"
                  ? "Try again"
                  : "Generate again"}
              </Button>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}
