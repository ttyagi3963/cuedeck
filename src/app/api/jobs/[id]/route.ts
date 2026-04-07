import { NextResponse } from "next/server";
import { NotFoundError } from "@/contracts/errors";
import { jobService } from "@/lib/container";
import { toErrorResponse } from "@/app/api/_lib/errors";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const job = await jobService.findById(id);
    if (!job) {
      throw new NotFoundError("Job");
    }

    return NextResponse.json(job);
  } catch (error) {
    return toErrorResponse(error, "Failed to fetch job");
  }
}
