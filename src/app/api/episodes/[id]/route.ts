import { NextResponse } from "next/server";
import {
  episodeService,
  storageService,
} from "@/lib/container";
import { NotFoundError } from "@/contracts/errors";
import { toErrorResponse } from "@/app/api/_lib/errors";
import { getStoredPathFromUrl } from "@/lib/uploads";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const episode = await episodeService.findById(id);
    if (!episode) {
      throw new NotFoundError("Episode");
    }

    await episodeService.delete(id);

    const storedPath = getStoredPathFromUrl(episode.sourceUrl);
    if (storedPath) {
      await storageService.delete(storedPath);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error, "Failed to delete episode");
  }
}
