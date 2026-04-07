import { z } from "zod";

export const storageBucketSchema = z.enum(["episodes", "ads", "generated"]);

export const storedFileSchema = z.object({
  path: z.string().min(1),
  url: z.string().min(1),
  size: z.number().nonnegative(),
  contentType: z.string().min(1),
});
