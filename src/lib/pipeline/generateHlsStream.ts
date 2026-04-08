import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { HlsPackageResult } from "@/contracts/generation";
import type { StoredFile } from "@/contracts/storage";
import { BusinessRuleError } from "@/contracts/errors";
import {
  HLS_AUDIO_CHANNELS,
  HLS_AUDIO_SAMPLE_RATE,
  HLS_NORMALIZED_FRAME_RATE,
  HLS_SEGMENT_DURATION_SEC,
  HLS_VARIANTS,
  type HlsVariantPreset,
} from "@/lib/constants";
import type { IStorageService } from "@/services/storage/IStorageService";
import {
  buildHlsMasterPlaylist,
  buildHlsStorageRoot,
  collectFilesRecursively,
  getHlsContentType,
  getRelativePath,
} from "@/utils/hls";
import { createPipelineTempDirectory, runFfmpeg } from "./ffmpeg";

function createScaleFilter(width: number, height: number) {
  return `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1`;
}

function createVariantArgs(
  inputPath: string,
  variantDirectory: string,
  variant: HlsVariantPreset,
) {
  const playlistPath = path.join(variantDirectory, "index.m3u8");
  const segmentFileNamePattern = path.join(variantDirectory, "segment-%03d.ts");
  const keyframeInterval = String(
    HLS_SEGMENT_DURATION_SEC * HLS_NORMALIZED_FRAME_RATE,
  );

  return [
    "-i",
    inputPath,
    "-vf",
    createScaleFilter(variant.width, variant.height),
    "-r",
    String(HLS_NORMALIZED_FRAME_RATE),
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-profile:v",
    "main",
    "-b:v",
    variant.videoBitrate,
    "-maxrate",
    variant.maxRate,
    "-bufsize",
    variant.bufferSize,
    "-pix_fmt",
    "yuv420p",
    "-g",
    keyframeInterval,
    "-keyint_min",
    keyframeInterval,
    "-sc_threshold",
    "0",
    "-c:a",
    "aac",
    "-b:a",
    variant.audioBitrate,
    "-ar",
    String(HLS_AUDIO_SAMPLE_RATE),
    "-ac",
    String(HLS_AUDIO_CHANNELS),
    "-f",
    "hls",
    "-hls_time",
    String(HLS_SEGMENT_DURATION_SEC),
    "-hls_playlist_type",
    "vod",
    "-hls_flags",
    "independent_segments",
    "-hls_segment_filename",
    segmentFileNamePattern,
    "-y",
    playlistPath,
  ] as const;
}

export async function generateHlsStream(
  episodeId: string,
  sourceFile: StoredFile,
  storageService: IStorageService,
): Promise<HlsPackageResult> {
  if (!sourceFile.url) {
    throw new BusinessRuleError(
      "A generated MP4 is required before packaging HLS output",
      "HLS_SOURCE_REQUIRED",
    );
  }

  const inputPath = await storageService.provideLocalCopy(sourceFile.url);
  const tempDirectory = await createPipelineTempDirectory("generate-hls-");
  const hlsOutputDirectory = path.join(tempDirectory, "hls");
  const storageRoot = buildHlsStorageRoot(
    episodeId,
    `${Date.now()}-${randomUUID()}`,
  );

  console.info(
    `[HLS] Starting package generation for episode ${episodeId} from ${sourceFile.path}`,
  );
  console.info(`[HLS] Local input path: ${inputPath}`);
  console.info(`[HLS] Temp output directory: ${hlsOutputDirectory}`);

  try {
    await fs.mkdir(hlsOutputDirectory, { recursive: true });

    for (const variant of HLS_VARIANTS) {
      const variantDirectory = path.join(hlsOutputDirectory, variant.name);
      await fs.mkdir(variantDirectory, { recursive: true });
      console.info(
        `[HLS] Generating variant ${variant.name} (${variant.width}x${variant.height})`,
      );
      await runFfmpeg(createVariantArgs(inputPath, variantDirectory, variant), {
        logLabel: `hls-${variant.name}`,
        logProgress: true,
      });
      console.info(`[HLS] Finished variant ${variant.name}`);
    }

    const masterPlaylistPath = path.join(hlsOutputDirectory, "master.m3u8");
    await fs.writeFile(
      masterPlaylistPath,
      buildHlsMasterPlaylist(HLS_VARIANTS),
      "utf8",
    );
    console.info(`[HLS] Master playlist written to ${masterPlaylistPath}`);

    const localFiles = await collectFilesRecursively(hlsOutputDirectory);
    const uploadedFiles = new Map<string, StoredFile>();
    console.info(`[HLS] Uploading ${localFiles.length} HLS files to storage root ${storageRoot}`);

    for (const localFilePath of localFiles) {
      const relativePath = getRelativePath(hlsOutputDirectory, localFilePath);
      console.info(`[HLS] Uploading ${relativePath}`);
      const storedFile = await storageService.save({
        bucket: "generated",
        fileName: `${storageRoot}/${relativePath}`,
        contentType: getHlsContentType(relativePath),
        buffer: await fs.readFile(localFilePath),
      });
      uploadedFiles.set(relativePath, storedFile);
    }

    const masterPlaylist = uploadedFiles.get("master.m3u8");
    if (!masterPlaylist) {
      throw new Error("HLS master playlist was not uploaded");
    }

    const variants = HLS_VARIANTS.map((variant) => {
      const playlist = uploadedFiles.get(`${variant.name}/index.m3u8`);
      if (!playlist) {
        throw new Error(`HLS playlist for variant ${variant.name} was not uploaded`);
      }

      const segmentCount = [...uploadedFiles.keys()].filter(
        (relativePath) =>
          relativePath.startsWith(`${variant.name}/`) &&
          relativePath.endsWith(".ts"),
      ).length;

      return {
        name: variant.name,
        playlist,
        bandwidth: variant.bandwidth,
        averageBandwidth: variant.averageBandwidth,
        width: variant.width,
        height: variant.height,
        segmentCount,
      };
    });

    const segmentFileCount = [...uploadedFiles.keys()].filter((relativePath) =>
      relativePath.endsWith(".ts"),
    ).length;

    console.info(
      `[HLS] Package complete for episode ${episodeId}: ${variants.length} variants, ${segmentFileCount} segment files`,
    );

    return {
      masterPlaylist,
      variants,
      segmentFileCount,
    };
  } finally {
    await fs.rm(tempDirectory, { recursive: true, force: true });
  }
}
