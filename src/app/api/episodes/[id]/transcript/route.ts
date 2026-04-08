import { NextResponse } from "next/server";
import { jobService, transcriptService } from "@/lib/container";
import { toErrorResponse } from "@/app/api/_lib/errors";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id: episodeId } = await params;

  try {
    const [segments, latestJob] = await Promise.all([
      transcriptService.findByEpisodeId(episodeId),
      jobService.findLatestByEpisodeIdAndType(episodeId, "TRANSCRIBE"),
    ]);

    return NextResponse.json({
      segments,
      latestJob: latestJob
        ? {
            id: latestJob.id,
            status: latestJob.status,
            progress: latestJob.progress,
            error: latestJob.error,
            result: latestJob.result,
          }
        : null,
    });
  } catch (error) {
    return toErrorResponse(error, "Failed to fetch transcript");
  }
}
