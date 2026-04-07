import { z } from "zod";

const optionalCompanyNameSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const createAdSchema = z.object({
  title: z.string().trim().min(1, "title is required"),
  companyName: optionalCompanyNameSchema,
  videoUrl: z.string().trim().min(1, "videoUrl is required"),
  duration: z.number().positive("duration must be a positive number"),
});

export const adSchema = z.object({
  id: z.string(),
  title: z.string(),
  companyName: z.string().nullable().optional(),
  videoUrl: z.string(),
  duration: z.number(),
  createdAt: z.string(),
});
