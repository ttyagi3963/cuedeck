export function normalizeStoredPath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/{2,}/g, "/");
}

export function sanitizePathSegment(value: string): string {
  const sanitized = value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitized || "file";
}
