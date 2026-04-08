import path from "node:path";
import type { StorageBucket } from "@/contracts/storage";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildStoredFileName(
  bucket: StorageBucket,
  originalName: string,
  title: string,
): string {
  const baseName = slugify(title) || slugify(originalName) || bucket;
  const ext = path.extname(originalName) || ".mp4";
  return `${Date.now()}-${baseName}${ext.toLowerCase()}`;
}
