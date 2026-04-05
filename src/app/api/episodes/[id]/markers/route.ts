import { NextResponse } from "next/server";
import { markerRepository } from "@/lib/composition/composition";
import { MARKER_TYPES } from "@/contracts/marker";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id: episodeId } = await params;
  const markers = await markerRepository.findByEpisodeId(episodeId);

  return NextResponse.json(markers);
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id: episodeId } = await params;
  const body = await request.json();

  const { timeSec, type } = body;

  if (typeof timeSec !== "number" || timeSec < 0) {
    return NextResponse.json(
      { error: "timeSec must be a non-negative number" },
      { status: 400 },
    );
  }

  if (!MARKER_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `type must be one of: ${MARKER_TYPES.join(", ")}` },
      { status: 400 },
    );
  }

  const marker = await markerRepository.create(episodeId, timeSec, type);

  return NextResponse.json(marker, { status: 201 });
}
