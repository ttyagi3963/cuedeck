import type { ReactNode } from "react";
import type { Episode } from "@/contracts/episode";
import { EditorProvider } from "@/context/EditorContext";
import EditorShell from "./EditorShell";
import TranscriptSidePanel from "./TranscriptSidePanel";

type EditorPageProps = {
  episode: Episode;
  initialGenerationJobId?: string | null;
  header?: ReactNode;
};

export default function EditorPage({
  episode,
  initialGenerationJobId = null,
  header,
}: EditorPageProps) {
  return (
    <EditorProvider
      episode={episode}
      initialGenerationJobId={initialGenerationJobId}
    >
      <div className="flex flex-1 min-w-0 flex-col lg:flex-row">
        <div className="flex-1 min-w-0 flex flex-col gap-page-gap p-content-p-xs lg:p-page-padding">
          {header}
          <EditorShell />
        </div>
        <TranscriptSidePanel />
      </div>
    </EditorProvider>
  );
}
