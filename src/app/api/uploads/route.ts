import { NextResponse } from "next/server";
import { z } from "zod";
import { storageService } from "@/lib/container";
import { toErrorResponse } from "@/app/api/_lib/errors";
import { buildStoredFileName } from "@/lib/uploads";

const uploadKindSchema = z.enum(["episode", "ad"]);

const createUploadTargetSchema = z.object({
  kind: uploadKindSchema,
  title: z.string().trim().min(1, "title is required"),
  originalName: z.string().trim().min(1, "originalName is required"),
  contentType: z
    .string()
    .trim()
    .min(1, "contentType is required")
    .refine((value) => value.startsWith("video/"), "A video file is required"),
  size: z.number().int().positive("size must be a positive number"),
});

const STORAGE_BUCKET_BY_KIND = {
  episode: "episodes",
  ad: "ads",
} as const;

export async function POST(request: Request) {
  try {
    const body = createUploadTargetSchema.parse(await request.json());
    const bucket = STORAGE_BUCKET_BY_KIND[body.kind];

    const uploadTarget = await storageService.createUploadTarget({
      bucket,
      fileName: buildStoredFileName(bucket, body.originalName, body.title),
      contentType: body.contentType,
      contentLength: body.size,
    });

    return NextResponse.json(uploadTarget, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Failed to create upload target");
  }
}
