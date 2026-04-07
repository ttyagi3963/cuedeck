import { NextResponse } from "next/server";
import { markerService } from "@/lib/composition/composition";
import { toErrorResponse } from "@/app/api/_lib/errors";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const marker = await markerService.update(id, body);
    return NextResponse.json(marker);
  } catch (error) {
    return toErrorResponse(error, "Failed to update marker");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    await markerService.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error, "Failed to delete marker");
  }
}
