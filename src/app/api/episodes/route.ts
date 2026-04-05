import { episodeRepository } from "@/lib/composition/composition";
import { NextResponse } from "next/server";

export async function GET() {
  const episodes = await episodeRepository.findAll();

  return NextResponse.json(episodes);
}
