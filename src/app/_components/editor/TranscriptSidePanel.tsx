"use client";

import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useLayout } from "@/context/LayoutContext";
import { useEditor } from "@/context/EditorContext";
import { useTranscriptPanel } from "@/hooks/useTranscript";
import TranscriptPanel from "./TranscriptPanel";

export default function TranscriptSidePanel() {
  const { isTranscriptPanelOpen, openTranscriptPanel, closeTranscriptPanel } =
    useLayout();
  const { episode } = useEditor();
  const transcriptQuery = useTranscriptPanel(episode.id);
  const segments = transcriptQuery.data?.segments ?? [];
  const hasTranscript = segments.length > 0;

  if (!isTranscriptPanelOpen) {
    return (
      <>
        {/* Collapsed bar — desktop only */}
        <div className="hidden lg:flex shrink-0 w-10 flex-col items-center border-l border-border-default bg-surface">
          <button
            type="button"
            onClick={openTranscriptPanel}
            className="relative mt-4 flex h-10 w-10 items-center justify-center text-text-muted transition-colors hover:text-text-heading"
            aria-label="Open transcript panel"
            title="Transcript"
          >
            <PanelRightOpen className="h-5 w-5" />
            {hasTranscript && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-trend-positive text-[8px] font-bold text-text-on-primary">
                {segments.length}
              </span>
            )}
          </button>
          <span className="mt-4 text-[11px] font-semibold text-text-muted [writing-mode:vertical-lr] rotate-180">
            Transcript
          </span>
        </div>

        {/* Mobile: show full transcript below */}
        <div className="lg:hidden">
          <TranscriptPanel />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Open panel — desktop */}
      <div className="hidden lg:flex shrink-0 w-[360px] flex-col border-l border-border-default bg-surface overflow-hidden transition-[width] duration-300">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-sm font-bold text-text-heading">Transcript</span>
          <button
            type="button"
            onClick={closeTranscriptPanel}
            className="flex h-8 w-8 items-center justify-center rounded-button-primary text-text-muted transition-colors hover:bg-background-hover hover:text-text-heading"
            aria-label="Close transcript panel"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden px-4 pb-4">
          <TranscriptPanel />
        </div>
      </div>

      {/* Mobile: show full transcript below */}
      <div className="lg:hidden">
        <TranscriptPanel />
      </div>
    </>
  );
}
