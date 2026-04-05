import { NextResponse } from "next/server";
import { markerRepository } from "@/lib/composition/composition";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  const marker = await markerRepository.findById(id);

  if (!marker) {
    return NextResponse.json({ error: "Marker not found" }, { status: 404 });
  }

  await markerRepository.delete(id);

  return new NextResponse(null, { status: 204 });
}
