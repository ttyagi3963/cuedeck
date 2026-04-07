"use client";

import { useEditor } from "@/context/EditorContext";
import VideoPlayer from "./VideoPlayer";
import VideoControls from "./VideoControls";
import Waveform from "./Wave";
import AdMarkers from "./AdMarkers";
import CreateMarkerDialog from "./CreateMarkerDialog";
import EditMarkerDialog from "./EditMarkerDialog";

export default function EditorShell() {
  const {
    isCreateDialogOpen,
    closeCreateDialog,
    createMarker,
    autoCreateMarker,
    playback,
    editingMarker,
    closeEditDialog,
    editMarker,
  } = useEditor();

  return (
    <>
      <div className="flex min-w-0 gap-content-gap-lg">
        <AdMarkers />
        <CreateMarkerDialog
          open={isCreateDialogOpen}
          onClose={closeCreateDialog}
          onConfirm={createMarker}
          onAutoCreate={autoCreateMarker}
          currentTime={playback.currentTime}
        />
        {editingMarker && (
          <EditMarkerDialog
            marker={editingMarker}
            onClose={closeEditDialog}
            onConfirm={editMarker}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-content-gap-sm rounded-xl border border-border-default bg-surface p-ad-markers-padding">
          <VideoPlayer />
          <VideoControls />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-content-gap-lg">
        <Waveform />
      </div>
    </>
  );
}
