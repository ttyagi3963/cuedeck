import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { StoredFile } from "@/contracts/storage";
import type { GenerationPlan, ResolvedGenerationInsertion } from "@/contracts/generation";
import { BusinessRuleError } from "@/contracts/errors";
import type { IStorageService } from "@/services/storage/IStorageService";
import {
  createPipelineTempDirectory,
  runFfmpeg,
  toFfmpegConcatPath,
} from "./ffmpeg";

const NORMALIZED_VIDEO_WIDTH = 1280;
const NORMALIZED_VIDEO_HEIGHT = 720;
const NORMALIZED_FRAME_RATE = 30;
const NORMALIZED_AUDIO_SAMPLE_RATE = 48000;
const MIN_SEGMENT_DURATION_SEC = 0.05;

type EpisodeClipStep = {
  kind: "episode";
  sourcePath: string;
  startTimeSec: number;
  durationSec: number;
};

type AdClipStep = {
  kind: "ad";
  sourcePath: string;
};

type ClipStep = EpisodeClipStep | AdClipStep;

export type GenerateFinalVideoResult = {
  storedFile: StoredFile;
  segmentCount: number;
};

import { sanitizePathSegment } from "@/utils/paths";

function buildGeneratedVideoFileName(episodeId: string) {
  return `${sanitizePathSegment(episodeId)}/${Date.now()}-final-video-${randomUUID()}.mp4`;
}

function sortInsertions(insertions: readonly ResolvedGenerationInsertion[]) {
  return [...insertions].sort((left, right) => {
    if (left.markerTimeSec !== right.markerTimeSec) {
      return left.markerTimeSec - right.markerTimeSec;
    }

    return left.markerId.localeCompare(right.markerId);
  });
}

function validatePlan(plan: GenerationPlan) {
  if (plan.episodeDuration <= 0) {
    throw new BusinessRuleError(
      "Episode duration must be greater than zero before generating a final video",
      "INVALID_EPISODE_DURATION",
    );
  }

  if (plan.insertions.length === 0) {
    throw new BusinessRuleError(
      "At least one resolved insertion is required to generate a final video",
      "GENERATION_INSERTIONS_REQUIRED",
    );
  }
}

function buildClipSteps(
  sourcePath: string,
  episodeDuration: number,
  resolvedInsertions: readonly {
    insertion: ResolvedGenerationInsertion;
    sourcePath: string;
  }[],
) {
  const steps: ClipStep[] = [];
  let currentEpisodeTime = 0;

  for (const { insertion, sourcePath: adSourcePath } of resolvedInsertions) {
    if (insertion.markerTimeSec < 0 || insertion.markerTimeSec > episodeDuration) {
      throw new BusinessRuleError(
        `Marker ${insertion.markerId} is outside the episode duration`,
        "MARKER_TIME_OUT_OF_RANGE",
      );
    }

    if (insertion.markerTimeSec < currentEpisodeTime - MIN_SEGMENT_DURATION_SEC) {
      throw new BusinessRuleError(
        `Marker ${insertion.markerId} is earlier than a previously processed marker`,
        "MARKER_ORDER_INVALID",
      );
    }

    const contentDuration = insertion.markerTimeSec - currentEpisodeTime;
    if (contentDuration > MIN_SEGMENT_DURATION_SEC) {
      steps.push({
        kind: "episode",
        sourcePath,
        startTimeSec: currentEpisodeTime,
        durationSec: contentDuration,
      });
    }

    steps.push({
      kind: "ad",
      sourcePath: adSourcePath,
    });

    currentEpisodeTime = insertion.markerTimeSec;
  }

  const remainingDuration = episodeDuration - currentEpisodeTime;
  if (remainingDuration > MIN_SEGMENT_DURATION_SEC) {
    steps.push({
      kind: "episode",
      sourcePath,
      startTimeSec: currentEpisodeTime,
      durationSec: remainingDuration,
    });
  }

  return steps;
}

function createNormalizationArgs(inputPath: string, outputPath: string) {
  return [
    "-i",
    inputPath,
    "-vf",
    `scale=${NORMALIZED_VIDEO_WIDTH}:${NORMALIZED_VIDEO_HEIGHT}:force_original_aspect_ratio=decrease,pad=${NORMALIZED_VIDEO_WIDTH}:${NORMALIZED_VIDEO_HEIGHT}:(ow-iw)/2:(oh-ih)/2,setsar=1`,
    "-r",
    String(NORMALIZED_FRAME_RATE),
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    String(NORMALIZED_AUDIO_SAMPLE_RATE),
    "-ac",
    "2",
    "-movflags",
    "+faststart",
    "-y",
    outputPath,
  ] as const;
}

async function createEpisodeClip(
  step: EpisodeClipStep,
  outputPath: string,
) {
  await runFfmpeg([
    "-ss",
    step.startTimeSec.toFixed(3),
    "-t",
    step.durationSec.toFixed(3),
    ...createNormalizationArgs(step.sourcePath, outputPath),
  ]);
}

async function createAdClip(step: AdClipStep, outputPath: string) {
  await runFfmpeg(createNormalizationArgs(step.sourcePath, outputPath));
}

async function normalizeStep(step: ClipStep, outputPath: string) {
  if (step.kind === "episode") {
    await createEpisodeClip(step, outputPath);
    return;
  }

  await createAdClip(step, outputPath);
}

async function writeConcatFile(clipPaths: readonly string[], filePath: string) {
  const lines = clipPaths.map((clipPath) => `file '${toFfmpegConcatPath(clipPath)}'`);
  await fs.writeFile(filePath, `${lines.join("\n")}\n`, "utf8");
}

export async function generateFinalVideo(
  plan: GenerationPlan,
  storageService: IStorageService,
): Promise<GenerateFinalVideoResult> {
  validatePlan(plan);

  const sourcePath = await storageService.provideLocalCopy(plan.sourceUrl);
  const resolvedInsertions = await Promise.all(
    sortInsertions(plan.insertions).map(async (insertion) => ({
      insertion,
      sourcePath: await storageService.provideLocalCopy(
        insertion.resolvedAd.videoUrl,
      ),
    })),
  );

  const steps = buildClipSteps(
    sourcePath,
    plan.episodeDuration,
    resolvedInsertions,
  );
  const tempDirectory = await createPipelineTempDirectory();
  const outputFilePath = path.join(tempDirectory, "final-output.mp4");

  try {
    const clipPaths: string[] = [];

    for (let index = 0; index < steps.length; index += 1) {
      const clipPath = path.join(
        tempDirectory,
        `clip-${String(index + 1).padStart(3, "0")}.mp4`,
      );
      await normalizeStep(steps[index], clipPath);
      clipPaths.push(clipPath);
    }

    const concatFilePath = path.join(tempDirectory, "concat.txt");
    await writeConcatFile(clipPaths, concatFilePath);

    await runFfmpeg([
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concatFilePath,
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      "-y",
      outputFilePath,
    ]);

    const storedFile = await storageService.save({
      bucket: "generated",
      fileName: buildGeneratedVideoFileName(plan.episodeId),
      contentType: "video/mp4",
      buffer: await fs.readFile(outputFilePath),
    });

    return {
      storedFile,
      segmentCount: clipPaths.length,
    };
  } finally {
    await fs.rm(tempDirectory, { recursive: true, force: true });
  }
}
