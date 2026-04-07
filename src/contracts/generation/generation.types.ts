import type { Job } from "@/contracts/job";
import type { MarkerType } from "@/contracts/marker";
import type { StoredFile } from "@/contracts/storage";

export interface ResolvedGenerationAd {
  id: string;
  title: string;
  companyName: string | null;
  videoUrl: string;
  duration: number;
}

export interface ResolvedGenerationInsertion {
  markerId: string;
  markerTimeSec: number;
  markerType: MarkerType;
  resolvedAd: ResolvedGenerationAd;
}

export interface GenerationPlan {
  episodeId: string;
  sourceUrl: string;
  episodeDuration: number;
  insertions: ResolvedGenerationInsertion[];
}

export interface GenerationJobResult {
  storedFile: StoredFile;
  segmentCount: number;
}

export interface StartGenerationResult {
  job: Job;
  plan: GenerationPlan;
}
