"use client";

import { useState } from "react";
import type { Ad } from "@/contracts/ad";
import { useAds } from "@/hooks/useAds";
import { useDeleteAd } from "@/hooks/useDashboardMutations";
import { useToast } from "@/hooks/useToast";
import Button from "@/app/_components/ui/Button";
import Dialog from "@/app/_components/ui/Dialog";

type AdListProps = {
  ads: Ad[];
};

export default function AdList({ ads: initialAds }: AdListProps) {
  const { data: ads = [] } = useAds(initialAds);
  const deleteAdMutation = useDeleteAd();
  const { toast } = useToast();
  const [adToDelete, setAdToDelete] = useState<Ad | null>(null);

  async function handleConfirmDelete() {
    if (!adToDelete) return;

    try {
      await deleteAdMutation.mutateAsync(adToDelete.id);
      toast("Ad deleted");
      setAdToDelete(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete ad";
      toast(message, "error");
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-heading">Ads</h2>
        <span className="text-sm text-text-muted">
          {ads.length} {ads.length === 1 ? "ad" : "ads"}
        </span>
      </div>

      {ads.length === 0 ? (
        <div className="rounded-xl border border-border-default bg-surface p-6 text-sm text-text-muted">
          No ads uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="flex flex-col gap-3 rounded-xl border border-border-default bg-surface p-4"
            >
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                <video
                  src={ad.videoUrl}
                  className="h-full w-full object-cover"
                  preload="metadata"
                  muted
                />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="line-clamp-2 text-sm font-semibold text-text-heading">
                  {ad.title}
                </h3>
                {ad.companyName && (
                  <p className="text-xs font-medium text-text-muted">
                    {ad.companyName}
                  </p>
                )}
                <p className="text-xs text-text-muted">
                  {Math.floor(ad.duration / 60)}m {Math.floor(ad.duration % 60)}s
                </p>
              </div>

              <div className="flex gap-3">
                <a
                  href="#upload-ad"
                  className="inline-flex flex-1 items-center justify-center rounded-md border border-border-default bg-surface px-4 py-2 text-base font-semibold text-text-heading"
                >
                  Edit
                </a>
                <Button
                  variant="danger"
                  className="flex-1 justify-center rounded-md px-4 py-2"
                  onClick={() => setAdToDelete(ad)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={adToDelete !== null}
        onClose={() => setAdToDelete(null)}
        title="Delete ad?"
        subtitle={
          adToDelete
            ? `Are you sure you want to delete "${adToDelete.title}"?`
            : undefined
        }
      >
        <div className="flex gap-content-gap-sm">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setAdToDelete(null)}
            disabled={deleteAdMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant={deleteAdMutation.isPending ? "disabled" : "danger"}
            className="flex-1 justify-center"
            onClick={handleConfirmDelete}
            disabled={deleteAdMutation.isPending}
          >
            {deleteAdMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
