"use client";

import { useEditor } from "@/context/EditorContext";
import Button from "@/app/_components/ui/Button";
import { Plus, MagicWand } from "@/app/_components/ui/icons";
import MarkerList from "./MarkerList";

export default function AdMarkers() {
  const { markers, deleteMarker, openCreateDialog, autoCreateMarker } =
    useEditor();
  return (
    <div className="flex w-ad-markers-width shrink-0 flex-col rounded-ad-markers border border-border-default bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-ad-markers-padding pt-ad-markers-padding pb-content-gap-sm">
        <h2 className="text-base font-bold text-text-heading">Ad markers</h2>
        <span className="text-sm text-text-muted">
          {markers.length} {markers.length === 1 ? "marker" : "markers"}
        </span>
      </div>

      <MarkerList markers={markers} onDeleteMarker={deleteMarker} />

      {/* Actions */}
      <div className="flex flex-col gap-ad-markers-actions-gap px-ad-markers-padding pt-content-gap-sm pb-ad-markers-padding">
        <Button variant="primary" className="w-full" onClick={openCreateDialog}>
          Create ad marker <Plus />
        </Button>
        <Button variant="outline" className="w-full" onClick={autoCreateMarker}>
          Automatically place <MagicWand />
        </Button>
      </div>
    </div>
  );
}
