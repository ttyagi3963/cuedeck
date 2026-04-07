import { NextResponse } from "next/server";
import { markerService } from "@/lib/composition/composition";

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
    const message =
      error instanceof Error ? error.message : "Failed to update marker";
    const status = message === "Marker not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    await markerService.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Marker not found" }, { status: 404 });
  }
}
