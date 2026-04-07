import { z } from "zod";
import { MARKER_TYPES } from "@/contracts/marker";
import { storedFileSchema } from "@/contracts/storage";

export const resolvedGenerationAdSchema = z.object({
  id: z.string(),
  title: z.string(),
  companyName: z.string().nullable(),
  videoUrl: z.string(),
  duration: z.number(),
});

export const resolvedGenerationInsertionSchema = z.object({
  markerId: z.string(),
  markerTimeSec: z.number(),
  markerType: z.enum(MARKER_TYPES),
  resolvedAd: resolvedGenerationAdSchema,
});

export const generationPlanSchema = z.object({
  episodeId: z.string(),
  sourceUrl: z.string(),
  episodeDuration: z.number(),
  insertions: z.array(resolvedGenerationInsertionSchema),
});

export const generationJobResultSchema = z.object({
  storedFile: storedFileSchema,
  segmentCount: z.number().int().nonnegative(),
});
