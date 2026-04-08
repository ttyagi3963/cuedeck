import type { Episode } from "@/contracts/episode";
import { EditorProvider } from "@/context/EditorContext";
import EditorShell from "./EditorShell";

type EditorPageProps = {
  episode: Episode;
  initialGenerationJobId?: string | null;
};

export default function EditorPage({
  episode,
  initialGenerationJobId = null,
}: EditorPageProps) {
  return (
    <EditorProvider
      episode={episode}
      initialGenerationJobId={initialGenerationJobId}
    >
      <EditorShell />
    </EditorProvider>
  );
}
