import { z } from "zod";
import { STORAGE_BUCKETS } from "./storage.constants";

export const storageBucketSchema = z.enum(STORAGE_BUCKETS);

export const storedFileSchema = z.object({
  path: z.string().min(1),
  url: z.string().min(1),
  size: z.number().nonnegative(),
  contentType: z.string().min(1),
});

export const uploadTargetSchema = z.object({
  path: z.string().min(1),
  method: z.literal("PUT"),
  url: z.string().min(1),
  headers: z.record(z.string(), z.string()),
  expiresAt: z.string().datetime(),
});
