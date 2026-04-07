import { NextResponse } from "next/server";
import { adService, storageService } from "@/lib/composition/composition";
import { getStoredPathFromUrl } from "@/lib/uploads";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const ad = await adService.findById(id);
    if (!ad) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }

    await adService.delete(id);

    const storedPath = getStoredPathFromUrl(ad.videoUrl);
    if (storedPath) {
      await storageService.delete(storedPath);
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Failed to delete ad" }, { status: 500 });
  }
}
