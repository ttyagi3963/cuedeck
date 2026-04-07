import type { Episode } from "@/contracts/episode";
import type { Marker } from "@/contracts/marker";
import { EditorProvider } from "@/context/EditorContext";
import EditorShell from "./EditorShell";

type EditorPageProps = {
  episode: Episode;
  markers: Marker[];
};

export default function EditorPage({ episode, markers }: EditorPageProps) {
  return (
    <EditorProvider episode={episode} initialMarkers={markers}>
      <EditorShell />
    </EditorProvider>
  );
}
