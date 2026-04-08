import { NextResponse } from "next/server";
import { markerService, storageService } from "@/lib/container";
import { toErrorResponse } from "@/app/api/_lib/errors";
import {
  resolveMarkerMediaUrl,
  resolveMarkerMediaUrls,
} from "@/lib/media/resolveMediaUrls";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id: episodeId } = await params;
  const markers = await markerService.findByEpisodeId(episodeId);

  return NextResponse.json(await resolveMarkerMediaUrls(markers, storageService));
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id: episodeId } = await params;

  try {
    const body = await request.json();
    const marker = await markerService.create(episodeId, body);

    return NextResponse.json(
      await resolveMarkerMediaUrl(marker, storageService),
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error, "Failed to create marker");
  }
}
