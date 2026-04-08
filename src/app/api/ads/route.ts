import { NextResponse } from "next/server";
import { createAdSchema } from "@/contracts/ad";
import { adService, storageService } from "@/lib/container";
import { toErrorResponse } from "@/app/api/_lib/errors";
import { resolveAdMediaUrl, resolveAdMediaUrls } from "@/lib/media/resolveMediaUrls";

export async function GET() {
  const ads = await adService.findAll();

  return NextResponse.json(await resolveAdMediaUrls(ads, storageService));
}

export async function POST(request: Request) {
  try {
    const body = createAdSchema.parse(await request.json());

    if (!(await storageService.exists(body.videoUrl))) {
      return NextResponse.json(
        { error: "Uploaded media file was not found" },
        { status: 400 },
      );
    }

    const ad = await adService.create(body);

    return NextResponse.json(await resolveAdMediaUrl(ad, storageService), {
      status: 201,
    });
  } catch (error) {
    return toErrorResponse(error, "Failed to create ad");
  }
}
