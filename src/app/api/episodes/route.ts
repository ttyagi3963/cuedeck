import { NextResponse } from "next/server";
import { createEpisodeSchema } from "@/contracts/episode";
import { episodeService, storageService, waveformService } from "@/lib/container";
import { toErrorResponse } from "@/app/api/_lib/errors";
import {
  resolveEpisodeMediaUrl,
  resolveEpisodeMediaUrls,
} from "@/lib/media/resolveMediaUrls";

export async function GET() {
  const episodes = await episodeService.findAll();

  return NextResponse.json(
    await resolveEpisodeMediaUrls(episodes, storageService),
  );
}

export async function POST(request: Request) {
  try {
    const body = createEpisodeSchema.parse(await request.json());

    if (!(await storageService.exists(body.sourceUrl))) {
      return NextResponse.json(
        { error: "Uploaded media file was not found" },
        { status: 400 },
      );
    }

    const episode = await episodeService.create(body);

    try {
      await waveformService.start(episode.id);
    } catch (error) {
      console.error(
        `[episodes.POST] Failed to enqueue waveform job for ${episode.id}`,
        error,
      );
    }

    return NextResponse.json(await resolveEpisodeMediaUrl(episode, storageService), {
      status: 201,
    });
  } catch (error) {
    return toErrorResponse(error, "Failed to create episode");
  }
}
