import { z } from "zod";
import { MARKER_TYPES } from "./marker.types";

export const createMarkerSchema = z.object({
  timeSec: z.number().nonnegative("timeSec must be a non-negative number"),
  type: z.enum(MARKER_TYPES),
  adIds: z.array(z.string()).optional().default([]),
});

export const updateMarkerSchema = z.object({
  timeSec: z.number().nonnegative("timeSec must be a non-negative number"),
  adIds: z.array(z.string()).optional(),
});
