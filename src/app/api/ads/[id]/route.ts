import { NextResponse } from "next/server";
import { adService, storageService } from "@/lib/container";
import { NotFoundError } from "@/contracts/errors";
import { toErrorResponse } from "@/app/api/_lib/errors";
import { getStoredPathFromUrl } from "@/lib/uploads";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const ad = await adService.findById(id);
    if (!ad) {
      throw new NotFoundError("Ad");
    }

    await adService.delete(id);

    const storedPath = getStoredPathFromUrl(ad.videoUrl);
    if (storedPath) {
      await storageService.delete(storedPath);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error, "Failed to delete ad");
  }
}
