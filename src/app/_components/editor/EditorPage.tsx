"use client";

import { useState } from "react";
import type { Episode } from "@/contracts/episode";
import type { Marker, MarkerType } from "@/contracts/marker";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMarkers } from "@/hooks/useMarkers";
import { useCreateMarker, useDeleteMarker } from "@/hooks/useMarkerMutations";
import { useToast } from "@/hooks/useToast";
import VideoPlayer from "./VideoPlayer";
import VideoControls from "./VideoControls";
import AdMarkers from "./AdMarkers";
import CreateMarkerDialog from "./CreateMarkerDialog";

type EditorPageProps = {
  episode: Episode;
  markers: Marker[];
};

export default function EditorPage({ episode, markers }: EditorPageProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { videoRef, state, toggle, seek, skip, jumpToStart, jumpToEnd } =
    useVideoPlayer();
  const { canUndo, canRedo, record, undo, redo } = useUndoRedo();
  const { data: activeMarkers } = useMarkers(episode.id, markers);
  const createMutation = useCreateMarker(episode.id);
  const deleteMutation = useDeleteMarker(episode.id);
  const { toast } = useToast();

  useKeyboardShortcuts({ " ": toggle });

  function handleCreateMarker(type: MarkerType) {
    createMutation.mutate(
      { timeSec: state.currentTime, type },
      {
        onSuccess: () => toast("Marker created"),
        onError: () => toast("Failed to create marker", "error"),
      },
    );
  }

  function handleDeleteMarker(markerId: string) {
    deleteMutation.mutate(markerId, {
      onSuccess: () => toast("Marker deleted"),
      onError: () => toast("Failed to delete marker", "error"),
    });
  }

  function handleSeek(time: number) {
    record(state.currentTime);
    seek(time);
  }

  function handleUndo() {
    const time = undo();
    if (time !== null) seek(time);
  }

  function handleRedo() {
    const time = redo();
    if (time !== null) seek(time);
  }

  return (
    <div className="flex gap-content-gap-lg">
      <AdMarkers
        markers={activeMarkers}
        onCreateMarker={() => setIsCreateDialogOpen(true)}
        onDeleteMarker={handleDeleteMarker}
      />
      <CreateMarkerDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onConfirm={handleCreateMarker}
        currentTime={state.currentTime}
      />
      <div className="flex flex-1 flex-col gap-content-gap-sm rounded-xl border border-border-default bg-surface p-ad-markers-padding">
        <VideoPlayer
          videoRef={videoRef}
          src={episode.sourceUrl}
          currentTime={state.currentTime}
          duration={state.duration}
          onSeek={handleSeek}
        />
        <VideoControls
          state={state}
          toggle={toggle}
          skip={skip}
          jumpToStart={jumpToStart}
          jumpToEnd={jumpToEnd}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      </div>
    </div>
  );
}
