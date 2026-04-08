"use client";

import { useState } from "react";
import Link from "next/link";
import type { Episode } from "@/contracts/episode";
import { formatDurationShort } from "@/utils/time";
import { useDeleteEpisode } from "@/hooks/useDashboardMutations";
import { useEpisodes } from "@/hooks/useEpisodes";
import { useToast } from "@/hooks/useToast";
import Button from "@/app/_components/ui/Button";
import Dialog from "@/app/_components/ui/Dialog";
import UploadMediaForm from "@/app/_components/upload/UploadMediaForm";
import { UPLOAD_MEDIA_FORM_COPY } from "@/lib/constants";

export default function EpisodeList() {
  const { data: episodes = [] } = useEpisodes();
  const deleteEpisodeMutation = useDeleteEpisode();
  const { toast } = useToast();
  const [episodeToDelete, setEpisodeToDelete] = useState<Episode | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const uploadCopy = UPLOAD_MEDIA_FORM_COPY.episode;

  async function handleConfirmDelete() {
    if (!episodeToDelete) return;

    try {
      await deleteEpisodeMutation.mutateAsync(episodeToDelete.id);
      toast("Episode deleted");
      setEpisodeToDelete(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete episode";
      toast(message, "error");
    }
  }

  return (
    <section className="flex flex-col gap-content-gap-sm border border-border-default rounded-ad-markers bg-surface p-content-p-sm">
      <div className="flex items-center justify-between ">
        <h2 className="text-2xl font-bold text-text-heading">Episodes</h2>
        <span className="text-sm text-text-muted">
          {episodes.length} {episodes.length === 1 ? "episode" : "episodes"}
        </span>
      </div>

      {episodes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-content-gap-sm py-20">
          <h3 className="text-xl font-bold text-text-heading">
            No Episodes Present
          </h3>
          <Button variant="primary" onClick={() => setIsUploadOpen(true)}>
            {uploadCopy.emptyStateCtaLabel}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-dialog-gap xl:grid-cols-3">
            {episodes.map((episode) => (
              <div
                key={episode.id}
                className="flex flex-col gap-content-gap-md rounded-ad-markers border border-border-default bg-surface p-content-p-xs md:p-content-p-sm"
              >
                <Link
                  href={`/editor/${episode.id}`}
                  className="group flex flex-col gap-content-gap-md"
                >
                  <div className="aspect-video w-full overflow-hidden rounded-dialog bg-video-bg">
                    <video
                      src={episode.sourceUrl}
                      className="h-full w-full object-cover"
                      preload="metadata"
                      muted
                    />
                  </div>
                  <div className="flex flex-col gap-content-gap-xxs">
                    <h3 className="line-clamp-2 text-sm font-semibold text-text-heading group-hover:text-interactive-primary">
                      {episode.title}
                    </h3>
                    <p className="text-xs text-text-muted">
                      {formatDurationShort(episode.duration)}
                    </p>
                  </div>
                </Link>

                <div className="flex flex-col sm:flex-row gap-content-gap-md">
                  <Link
                    href={`/editor/${episode.id}`}
                    className="inline-flex flex-1 items-center justify-center rounded-button-primary border border-border-default bg-surface px-4 py-2 text-base font-semibold text-text-heading"
                  >
                    Edit
                  </Link>
                  <Button
                    variant="danger"
                    className="flex-1 justify-center rounded-button-primary px-4 py-2"
                    onClick={() => setEpisodeToDelete(episode)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center my-[10px] border border-dashed border-border-default rounded-button-primary p-content-p-sm">
            <Button variant="primary" onClick={() => setIsUploadOpen(true)}>
              {uploadCopy.dashboardCtaLabel}
            </Button>
          </div>
        </>
      )}

      <Dialog
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title={uploadCopy.title}
        subtitle={uploadCopy.description}
      >
        <UploadMediaForm
          key={String(isUploadOpen)}
          kind="episode"
          showHeader={false}
          onSuccess={() => setIsUploadOpen(false)}
        />
      </Dialog>

      <Dialog
        open={episodeToDelete !== null}
        onClose={() => setEpisodeToDelete(null)}
        title="Delete episode?"
        subtitle={
          episodeToDelete
            ? `Are you sure you want to delete "${episodeToDelete.title}"?`
            : undefined
        }
      >
        <div className="flex gap-content-gap-sm">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setEpisodeToDelete(null)}
            disabled={deleteEpisodeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant={deleteEpisodeMutation.isPending ? "disabled" : "danger"}
            className="flex-1 justify-center"
            onClick={handleConfirmDelete}
            disabled={deleteEpisodeMutation.isPending}
          >
            {deleteEpisodeMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
