"use client";

import { useEditor } from "@/context/EditorContext";
import Button from "@/app/_components/ui/Button";
import { Plus, MagicWand } from "@/app/_components/ui/icons";
import MarkerList from "./MarkerList";
import GeneratedPreviewPanel from "./GeneratedPreviewPanel";

export default function AdMarkers() {
  const {
    markers,
    deleteMarker,
    openCreateDialog,
    openGenerateDialog,
    autoCreateMarker,
    generationJobId,
  } = useEditor();

  return (
    <div className="flex w-full lg:w-ad-markers-width shrink-0 flex-col rounded-ad-markers border border-border-default bg-surface">
      <div className="flex items-center justify-between px-content-p-xs pt-content-p-xs lg:px-ad-markers-padding lg:pt-ad-markers-padding pb-content-gap-sm">
        <h2 className="text-base font-bold text-text-heading">Ad markers</h2>
        <span className="text-sm text-text-muted">
          {markers.length} {markers.length === 1 ? "marker" : "markers"}
        </span>
      </div>

      <MarkerList markers={markers} onDeleteMarker={deleteMarker} />

      <div className="flex flex-col gap-ad-markers-actions-gap px-content-p-xs pb-content-p-xs lg:px-ad-markers-padding pt-content-gap-sm lg:pb-ad-markers-padding">
        <Button variant="primary" className="w-full" onClick={openCreateDialog}>
          Create ad marker <Plus />
        </Button>
        <Button variant="outline" className="w-full" onClick={autoCreateMarker}>
          Automatically place <MagicWand />
        </Button>
        <hr className="border-dashed border-border-default" />
        {generationJobId ? (
          <>
            <span className="text-xs text-text-muted text-center">
              Changed your markers?
            </span>
            <Button
              variant="outline"
              className="w-full bg-yellow-500"
              onClick={openGenerateDialog}
            >
              Regenerate Video
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={openGenerateDialog}
          >
            Generate final video
          </Button>
        )}
      </div>

      <GeneratedPreviewPanel />
    </div>
  );
}
