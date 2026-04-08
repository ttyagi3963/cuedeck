import type { Job } from "@/contracts/job";
import type { JsonValue, JobStatus } from "@/contracts/job";

export interface TranscriptSegment {
  id: string;
  episodeId: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
}

export interface CreateTranscriptSegmentInput {
  startTime: number;
  endTime: number;
  text: string;
  confidence?: number;
}

export interface TranscriptJobPayload {
  episodeId: string;
  episodeTitle: string;
  sourceUrl: string;
  episodeDuration: number;
}

export interface TranscriptJobResult {
  segmentCount: number;
  language: string | null;
  duration: number | null;
}

export interface TranscriptionResult {
  language: string | null;
  duration: number | null;
  segments: CreateTranscriptSegmentInput[];
}

export interface StartTranscriptionResult {
  job: Job;
}

export interface TranscriptJobSnapshot {
  id: string;
  status: JobStatus;
  progress: number;
  error: string | null;
  result: JsonValue | null;
}

export interface TranscriptPanelState {
  segments: TranscriptSegment[];
  latestJob: TranscriptJobSnapshot | null;
}
