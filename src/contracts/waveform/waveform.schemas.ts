import { z } from "zod";

export const waveformJobPayloadSchema = z.object({
  episodeId: z.string(),
  sourceUrl: z.string(),
});

export const waveformJobResultSchema = z.object({
  waveformUrl: z.string(),
  peakCount: z.number().int().nonnegative(),
  peaksPerSecond: z.number().int().positive(),
  durationSec: z.number().positive(),
  skipped: z.boolean().optional(),
});

export const WAVEFORM_STATUSES = [
  "READY",
  "PROCESSING",
  "QUEUED",
  "FAILED",
  "NONE",
] as const;

export const waveformStatusResponseSchema = z.object({
  status: z.enum(WAVEFORM_STATUSES),
  waveformUrl: z.string().nullable(),
  progress: z.number().int().min(0).max(100),
  error: z.string().nullable(),
});

export type WaveformStatus = (typeof WAVEFORM_STATUSES)[number];
export type WaveformJobPayload = z.infer<typeof waveformJobPayloadSchema>;
export type WaveformJobResult = z.infer<typeof waveformJobResultSchema>;
export type WaveformStatusResponse = z.infer<typeof waveformStatusResponseSchema>;
