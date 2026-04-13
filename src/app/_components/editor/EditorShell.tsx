"use client";

import dynamic from "next/dynamic";
import { useEditor } from "@/context/EditorContext";
import VideoPlayer from "./VideoPlayer";
import VideoControls from "./VideoControls";
import Waveform from "./Wave";
import AdMarkers from "./AdMarkers";
import TranscriptPanel from "./TranscriptPanel";

const CreateMarkerDialog = dynamic(() => import("./CreateMarkerDialog"), {
  ssr: false,
});
const EditMarkerDialog = dynamic(() => import("./EditMarkerDialog"), {
  ssr: false,
});
const GenerateEpisodeDialog = dynamic(() => import("./GenerateEpisodeDialog"), {
  ssr: false,
});

export default function EditorShell() {
  const {
    episode,
    markers,
    isCreateDialogOpen,
    closeCreateDialog,
    isGenerateDialogOpen,
    closeGenerateDialog,
    generationJobId,
    setGenerationJobId,
    createMarker,
    autoCreateMarker,
    playback,
    editingMarker,
    closeEditDialog,
    editMarker,
  } = useEditor();

  return (
    <>
      <div className="flex min-w-0 flex-col-reverse lg:flex-row gap-content-gap-lg">
        <AdMarkers />
        {isCreateDialogOpen && (
          <CreateMarkerDialog
            open={isCreateDialogOpen}
            onClose={closeCreateDialog}
            onConfirm={createMarker}
            onAutoCreate={autoCreateMarker}
            currentTime={playback.currentTime}
          />
        )}
        {isGenerateDialogOpen && (
          <GenerateEpisodeDialog
            open={isGenerateDialogOpen}
            onClose={closeGenerateDialog}
            episodeId={episode.id}
            episodeTitle={episode.title}
            markerCount={markers.length}
            jobId={generationJobId}
            onJobCreated={setGenerationJobId}
          />
        )}
        {editingMarker && (
          <EditMarkerDialog
            marker={editingMarker}
            onClose={closeEditDialog}
            onConfirm={editMarker}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-content-gap-sm rounded-ad-markers border border-border-default bg-surface p-content-p-xs lg:p-ad-markers-padding">
          <VideoPlayer />
          <VideoControls />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-content-gap-lg">
        <Waveform />
      </div>
      <TranscriptPanel />
    </>
  );
}
