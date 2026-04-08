"use client";

import { useState } from "react";
import type { Ad } from "@/contracts/ad";
import { useAds } from "@/hooks/useAds";
import { formatDurationShort } from "@/utils/time";
import { useDeleteAd } from "@/hooks/useDashboardMutations";
import { useToast } from "@/hooks/useToast";
import Button from "@/app/_components/ui/Button";
import Dialog from "@/app/_components/ui/Dialog";
import UploadMediaForm from "@/app/_components/upload/UploadMediaForm";
import { UPLOAD_MEDIA_FORM_COPY } from "@/lib/constants";

export default function AdList() {
  const { data: ads = [] } = useAds();
  const deleteAdMutation = useDeleteAd();
  const { toast } = useToast();
  const [adToDelete, setAdToDelete] = useState<Ad | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const uploadCopy = UPLOAD_MEDIA_FORM_COPY.ad;

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
    <section className="flex flex-col gap-content-gap-sm border border-border-default rounded-ad-markers bg-surface p-content-p-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-heading">Ads</h2>
        <span className="text-sm text-text-muted">
          {ads.length} {ads.length === 1 ? "ad" : "ads"}
        </span>
      </div>

      {ads.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-content-gap-sm py-20">
          <h3 className="text-xl font-bold text-text-heading">
            No Ads Present
          </h3>
          <Button variant="primary" onClick={() => setIsUploadOpen(true)}>
            {uploadCopy.emptyStateCtaLabel}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-dialog-gap xl:grid-cols-3 ">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="flex flex-col gap-content-gap-md rounded-ad-markers border border-border-default bg-surface p-[10px] md:p-content-p-sm"
              >
                <div className="aspect-video w-full overflow-hidden rounded-dialog bg-video-bg">
                  <video
                    src={ad.videoUrl}
                    className="h-full w-full object-cover"
                    preload="metadata"
                    muted
                  />
                </div>
                <div className="flex flex-col gap-content-gap-xxs">
                  <h3 className="line-clamp-2 text-sm font-semibold text-text-heading">
                    {ad.title}
                  </h3>
                  {ad.companyName ? (
                    <p className="text-xs font-medium text-text-muted">
                      {ad.companyName}
                    </p>
                  ) : (
                    <p className="text-xs font-medium text-text-muted">
                      <i>No company name</i>
                    </p>
                  )}
                  <p className="text-xs text-text-muted">
                    {formatDurationShort(ad.duration)}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-content-gap-md">
                  {/* <a
                    href="#upload-ad"
                    className="inline-flex flex-1 items-center justify-center rounded-button-primary border border-border-default bg-surface px-4 py-2 text-base font-semibold text-text-heading"
                  >
                    Edit
                  </a> */}
                  <Button
                    variant="danger"
                    className="flex-1 justify-center rounded-button-primary px-4 py-2"
                    onClick={() => setAdToDelete(ad)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center my-content-p-xs border border-dashed border-border-default rounded-ad-markers p-content-p-sm">
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
          kind="ad"
          showHeader={false}
          onSuccess={() => setIsUploadOpen(false)}
        />
      </Dialog>

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
