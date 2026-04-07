import { NextResponse } from "next/server";
import { adService, storageService } from "@/lib/composition/composition";
import { toErrorResponse } from "@/app/api/_lib/errors";
import {
  buildStoredFileName,
  parseDuration,
  parseOptionalTextField,
  parseTextField,
  parseVideoFile,
} from "@/lib/uploads";

export async function GET() {
  const ads = await adService.findAll();

  return NextResponse.json(ads);
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const title = parseTextField(formData.get("title"));
      const companyName = parseOptionalTextField(formData.get("companyName"));
      const duration = parseDuration(formData.get("duration"));
      const file = parseVideoFile(formData.get("file"));

      if (!title) {
        return NextResponse.json({ error: "title is required" }, { status: 400 });
      }

      if (duration === null) {
        return NextResponse.json(
          { error: "duration must be a positive number" },
          { status: 400 },
        );
      }

      if (!file) {
        return NextResponse.json(
          { error: "A video file is required" },
          { status: 400 },
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const storedFile = await storageService.save({
        bucket: "ads",
        fileName: buildStoredFileName("ads", file.name, title),
        contentType: file.type || "video/mp4",
        buffer: Buffer.from(arrayBuffer),
      });

      const ad = await adService.create({
        title,
        companyName,
        videoUrl: storedFile.url,
        duration,
      });

      return NextResponse.json(ad, { status: 201 });
    }

    const body = await request.json();
    const ad = await adService.create(body);

    return NextResponse.json(ad, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Failed to create ad");
  }
}
