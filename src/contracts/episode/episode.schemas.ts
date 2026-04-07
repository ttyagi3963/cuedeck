import { z } from "zod";

export const createEpisodeSchema = z.object({
  title: z.string().trim().min(1, "title is required"),
  sourceUrl: z.string().trim().min(1, "sourceUrl is required"),
  duration: z.number().positive("duration must be a positive number"),
});

export const episodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  sourceUrl: z.string(),
  duration: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
