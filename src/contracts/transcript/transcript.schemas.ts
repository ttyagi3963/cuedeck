import { z } from "zod";
import { JOB_STATUSES, jsonValueSchema } from "@/contracts/job";

export const createTranscriptSegmentSchema = z.object({
  startTime: z.number().nonnegative(),
  endTime: z.number().nonnegative(),
  text: z.string().trim().min(1, "text is required"),
  confidence: z.number().min(0).max(1).optional(),
});

export const transcriptSegmentSchema = z.object({
  id: z.string(),
  episodeId: z.string(),
  startTime: z.number().nonnegative(),
  endTime: z.number().nonnegative(),
  text: z.string(),
  confidence: z.number().min(0).max(1),
});

export const transcriptJobPayloadSchema = z.object({
  episodeId: z.string(),
  episodeTitle: z.string(),
  sourceUrl: z.string(),
  episodeDuration: z.number().positive(),
});

export const transcriptJobResultSchema = z.object({
  segmentCount: z.number().int().nonnegative(),
  language: z.string().nullable(),
  duration: z.number().positive().nullable(),
});

export const transcriptionResultSchema = z.object({
  language: z.string().nullable(),
  duration: z.number().positive().nullable(),
  segments: z.array(createTranscriptSegmentSchema),
});

export const transcriptJobSnapshotSchema = z.object({
  id: z.string(),
  status: z.enum(JOB_STATUSES),
  progress: z.number().int().min(0).max(100),
  error: z.string().nullable(),
  result: jsonValueSchema.nullable(),
});

export const transcriptPanelStateSchema = z.object({
  segments: z.array(transcriptSegmentSchema),
  latestJob: transcriptJobSnapshotSchema.nullable(),
});
