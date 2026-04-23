import { NextResponse } from "next/server";
import {
  episodeService,
  jobService,
  storageService,
  waveformService,
} from "@/lib/container";
import { toErrorResponse } from "@/app/api/_lib/errors";
import {
  waveformStatusResponseSchema,
  type WaveformStatusResponse,
} from "@/contracts/waveform";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const episode = await episodeService.findById(id);
    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    if (episode.waveformUrl) {
      const body: WaveformStatusResponse = waveformStatusResponseSchema.parse({
        status: "READY",
        waveformUrl: await storageService.getPublicUrl(episode.waveformUrl),
        progress: 100,
        error: null,
      });
      return NextResponse.json(body);
    }

    const latestJob = await jobService.findLatestByEpisodeIdAndType(id, "WAVEFORM");

    let body: WaveformStatusResponse;
    if (!latestJob) {
      body = {
        status: "NONE",
        waveformUrl: null,
        progress: 0,
        error: null,
      };
    } else if (latestJob.status === "QUEUED") {
      body = {
        status: "QUEUED",
        waveformUrl: null,
        progress: 0,
        error: null,
      };
    } else if (latestJob.status === "PROCESSING") {
      body = {
        status: "PROCESSING",
        waveformUrl: null,
        progress: latestJob.progress,
        error: null,
      };
    } else if (latestJob.status === "FAILED") {
      body = {
        status: "FAILED",
        waveformUrl: null,
        progress: 0,
        error: latestJob.error,
      };
    } else {
      // COMPLETED but episode.waveformUrl is null — stale / inconsistent state.
      body = {
        status: "NONE",
        waveformUrl: null,
        progress: 0,
        error: null,
      };
    }

    return NextResponse.json(waveformStatusResponseSchema.parse(body));
  } catch (error) {
    return toErrorResponse(error, "Failed to read waveform status");
  }
}

export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    await waveformService.start(id);
    return new NextResponse(null, { status: 202 });
  } catch (error) {
    return toErrorResponse(error, "Failed to start waveform generation");
  }
}
