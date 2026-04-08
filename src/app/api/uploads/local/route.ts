import { NextResponse } from "next/server";
import { isStorageBucket } from "@/contracts/storage";
import { storageService } from "@/lib/container";
import { normalizeStoredPath } from "@/utils/paths";

function resolveUploadPath(request: Request) {
  const requestUrl = new URL(request.url);
  const storedPath = normalizeStoredPath(requestUrl.searchParams.get("path") ?? "");
  const segments = storedPath.split("/").filter(Boolean);
  const [bucket, ...fileNameParts] = segments;

  if (
    !storedPath ||
    !bucket ||
    !isStorageBucket(bucket) ||
    fileNameParts.length === 0 ||
    segments.some((segment) => segment === "." || segment === "..")
  ) {
    return null;
  }

  return {
    bucket,
    fileName: fileNameParts.join("/"),
  };
}

export async function PUT(request: Request) {
  const storageProvider = (process.env.STORAGE_PROVIDER ?? "local")
    .trim()
    .toLowerCase();

  if (storageProvider !== "local") {
    return NextResponse.json({ error: "Local uploads are disabled" }, { status: 404 });
  }

  const uploadPath = resolveUploadPath(request);
  if (!uploadPath) {
    return NextResponse.json({ error: "Invalid upload path" }, { status: 400 });
  }

  const arrayBuffer = await request.arrayBuffer();
  if (arrayBuffer.byteLength <= 0) {
    return NextResponse.json({ error: "Upload body is required" }, { status: 400 });
  }

  const storedFile = await storageService.save({
    bucket: uploadPath.bucket,
    fileName: uploadPath.fileName,
    contentType:
      request.headers.get("content-type")?.trim() || "application/octet-stream",
    buffer: Buffer.from(arrayBuffer),
  });

  return NextResponse.json({ path: storedFile.path }, { status: 201 });
}
