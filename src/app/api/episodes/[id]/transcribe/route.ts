import { NextResponse } from "next/server";
import { transcriptionService } from "@/lib/container";
import { toErrorResponse } from "@/app/api/_lib/errors";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const result = await transcriptionService.start(id);
    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    return toErrorResponse(error, "Failed to start transcription");
  }
}
