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

export function parseDuration(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function parseTextField(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseOptionalTextField(
  value: FormDataEntryValue | null,
): string | undefined {
  const parsed = parseTextField(value);
  return parsed.length > 0 ? parsed : undefined;
}

export function parseVideoFile(value: FormDataEntryValue | null): File | null {
  if (!(value instanceof File)) return null;
  if (value.size <= 0) return null;
  if (!value.type.startsWith("video/")) return null;
  return value;
}

export function getStoredPathFromUrl(url: string): string | null {
  const prefix = "/videos/";
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}
