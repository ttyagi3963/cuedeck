import { z } from "zod";
import type { JsonValue } from "./job.types";
import { JOB_STATUSES, JOB_TYPES } from "./job.types";

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

export const createJobSchema = z.object({
  type: z.enum(JOB_TYPES),
  episodeId: z.string().trim().min(1, "episodeId is required"),
  status: z.enum(JOB_STATUSES).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  error: z.string().nullable().optional(),
  payload: jsonValueSchema.optional(),
  result: jsonValueSchema.optional(),
  retryCount: z.number().int().min(0).optional(),
  maxRetries: z.number().int().min(0).optional(),
  startedAt: z.date().nullable().optional(),
  completedAt: z.date().nullable().optional(),
});

export const updateJobSchema = z.object({
  status: z.enum(JOB_STATUSES).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  error: z.string().nullable().optional(),
  payload: jsonValueSchema.optional(),
  result: jsonValueSchema.optional(),
  retryCount: z.number().int().min(0).optional(),
  maxRetries: z.number().int().min(0).optional(),
  startedAt: z.date().nullable().optional(),
  completedAt: z.date().nullable().optional(),
});
