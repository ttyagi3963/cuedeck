import fs from "node:fs/promises";
import path from "node:path";
import type { HlsVariantPreset } from "@/lib/constants";
import { HLS_NORMALIZED_FRAME_RATE } from "@/lib/constants";

import { sanitizePathSegment } from "@/utils/paths";

export function buildHlsStorageRoot(episodeId: string, uniqueSuffix: string) {
  return `${sanitizePathSegment(episodeId)}/hls/${uniqueSuffix}`;
}

export function getHlsContentType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".m3u8":
      return "application/vnd.apple.mpegurl";
    case ".ts":
      return "video/mp2t";
    default:
      return "application/octet-stream";
  }
}

export function buildHlsMasterPlaylist(
  variants: readonly HlsVariantPreset[],
) {
  const lines = [
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    "#EXT-X-INDEPENDENT-SEGMENTS",
  ];

  for (const variant of variants) {
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},AVERAGE-BANDWIDTH=${variant.averageBandwidth},RESOLUTION=${variant.width}x${variant.height},FRAME-RATE=${HLS_NORMALIZED_FRAME_RATE.toFixed(3)}`,
      `${variant.name}/index.m3u8`,
    );
  }

  return `${lines.join("\n")}\n`;
}

export async function collectFilesRecursively(
  directoryPath: string,
): Promise<string[]> {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFilesRecursively(fullPath)));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

export function getRelativePath(rootPath: string, filePath: string) {
  return path.relative(rootPath, filePath).replace(/\\/g, "/");
}
