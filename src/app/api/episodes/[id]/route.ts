import { NextResponse } from "next/server";
import {
  episodeService,
  storageService,
} from "@/lib/container";
import { NotFoundError } from "@/contracts/errors";
import { toErrorResponse } from "@/app/api/_lib/errors";

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

    // Clean up storage artifacts. Use allSettled so one failure (e.g.
    // transient R2 hiccup) doesn't skip the rest — the DB row is already
    // gone and any remaining files are orphans.
    const fileCleanups: Promise<void>[] = [
      storageService.delete(episode.sourceUrl),
    ];
    if (episode.waveformUrl) {
      fileCleanups.push(storageService.delete(episode.waveformUrl));
    }
    const results = await Promise.allSettled(fileCleanups);
    for (const r of results) {
      if (r.status === "rejected") {
        console.error(
          `[episodes.DELETE] storage cleanup failed for episode ${id}:`,
          r.reason,
        );
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error, "Failed to delete episode");
  }
}
