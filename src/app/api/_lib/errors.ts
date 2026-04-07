import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DomainError } from "@/contracts/errors";

export function toErrorResponse(
  error: unknown,
  fallbackMessage = "Internal server error",
) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (error instanceof DomainError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode },
    );
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
