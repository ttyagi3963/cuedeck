"use client";

import { useState } from "react";
import Link from "next/link";
import type { Episode } from "@/contracts/episode";
import { useDeleteEpisode } from "@/hooks/useDashboardMutations";
import { useEpisodes } from "@/hooks/useEpisodes";
import { useToast } from "@/hooks/useToast";
import Button from "@/app/_components/ui/Button";
import Dialog from "@/app/_components/ui/Dialog";

type EpisodeListProps = {
  episodes: Episode[];
};

export default function EpisodeList({ episodes: initialEpisodes }: EpisodeListProps) {
  const { data: episodes = [] } = useEpisodes(initialEpisodes);
  const deleteEpisodeMutation = useDeleteEpisode();
  const { toast } = useToast();
  const [episodeToDelete, setEpisodeToDelete] = useState<Episode | null>(null);

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
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-heading">Episodes</h2>
        <span className="text-sm text-text-muted">
          {episodes.length} {episodes.length === 1 ? "episode" : "episodes"}
        </span>
      </div>

      {episodes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
          <h3 className="text-xl font-bold text-text-heading">
            No videos present
          </h3>
          <Link
            href="#upload-episode"
            className="inline-flex items-center justify-center rounded-md bg-background-primary px-4 py-3 text-sm font-medium text-text-on-primary"
          >
            Upload video
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {episodes.map((episode) => (
            <div
              key={episode.id}
              className="flex flex-col gap-3 rounded-xl border border-border-default bg-surface p-4"
            >
              <Link
                href={`/editor/${episode.id}`}
                className="group flex flex-col gap-3"
              >
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                  <video
                    src={episode.sourceUrl}
                    className="h-full w-full object-cover"
                    preload="metadata"
                    muted
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="line-clamp-2 text-sm font-semibold text-text-heading group-hover:text-interactive-primary">
                    {episode.title}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {Math.floor(episode.duration / 60)}m{" "}
                    {Math.floor(episode.duration % 60)}s
                  </p>
                </div>
              </Link>

              <div className="flex gap-3">
                <Link
                  href={`/editor/${episode.id}`}
                  className="inline-flex flex-1 items-center justify-center rounded-md border border-border-default bg-surface px-4 py-2 text-base font-semibold text-text-heading"
                >
                  Edit
                </Link>
                <Button
                  variant="danger"
                  className="flex-1 justify-center rounded-md px-4 py-2"
                  onClick={() => setEpisodeToDelete(episode)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

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
