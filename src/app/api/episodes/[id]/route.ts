import { NextResponse } from "next/server";
import {
  episodeService,
  storageService,
} from "@/lib/composition/composition";
import { getStoredPathFromUrl } from "@/lib/uploads";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const episode = await episodeService.findById(id);
    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    await episodeService.delete(id);

    const storedPath = getStoredPathFromUrl(episode.sourceUrl);
    if (storedPath) {
      await storageService.delete(storedPath);
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete episode" },
      { status: 500 },
    );
  }
}
