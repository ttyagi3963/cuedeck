import path from "node:path";

export const LOCAL_STORAGE_PUBLIC_PREFIX = "/videos/";
export const LOCAL_STORAGE_VIDEOS_ROOT = path.join(
  process.cwd(),
  "public",
  "videos",
);

function normalizeStoredPath(filePath: string) {
  return filePath.replace(/\\/g, "/").replace(/^\/+/, "");
}

export function buildLocalStoragePublicUrl(filePath: string) {
  return `${LOCAL_STORAGE_PUBLIC_PREFIX}${normalizeStoredPath(filePath)}`;
}

export function getLocalStoragePathFromPublicUrl(url: string): string | null {
  if (!url.startsWith(LOCAL_STORAGE_PUBLIC_PREFIX)) {
    return null;
  }

  return normalizeStoredPath(url.slice(LOCAL_STORAGE_PUBLIC_PREFIX.length));
}

export function getLocalStorageAbsolutePath(filePath: string) {
  return path.join(LOCAL_STORAGE_VIDEOS_ROOT, normalizeStoredPath(filePath));
}
