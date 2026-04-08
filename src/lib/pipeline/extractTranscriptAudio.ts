import fs from "node:fs/promises";
import path from "node:path";
import { InfrastructureError } from "@/lib/errors/InfrastructureError";
import type { IStorageService } from "@/services/storage/IStorageService";
import { createPipelineTempDirectory, runFfmpeg } from "./ffmpeg";

export type PreparedAudioFile = {
  filePath: string;
  dispose: () => Promise<void>;
};

export type TranscriptAudioSourceProbe = {
  hasAudioTrack: boolean;
};

function isMissingAudioStreamError(message: string) {
  return (
    /does not contain any stream/iu.test(message) ||
    /matches no streams/iu.test(message) ||
    /stream map .*0:a:0.*matches no streams/iu.test(message)
  );
}

export async function probeTranscriptAudioSource(
  sourceUrl: string,
  storageService: IStorageService,
): Promise<TranscriptAudioSourceProbe> {
  const inputPath = await storageService.provideLocalCopy(sourceUrl);

  try {
    await runFfmpeg([
      "-v",
      "error",
      "-i",
      inputPath,
      "-map",
      "0:a:0",
      "-t",
      "0.1",
      "-f",
      "null",
      "-",
    ]);

    return { hasAudioTrack: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (error instanceof InfrastructureError) {
      throw error;
    }

    if (isMissingAudioStreamError(message)) {
      return { hasAudioTrack: false };
    }

    throw new InfrastructureError(
      "Failed to inspect the episode video for an audio track.",
      "TRANSCRIPT_AUDIO_PROBE_FAILED",
    );
  }
}

export async function extractTranscriptAudio(
  sourceUrl: string,
  storageService: IStorageService,
): Promise<PreparedAudioFile> {
  const inputPath = await storageService.provideLocalCopy(sourceUrl);
  const tempDirectory = await createPipelineTempDirectory("extract-transcript-audio-");
  const outputPath = path.join(tempDirectory, "transcript-source.mp3");

  try {
    await runFfmpeg([
      "-i",
      inputPath,
      "-map",
      "0:a:0",
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "64k",
      "-y",
      outputPath,
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (error instanceof InfrastructureError) {
      throw error;
    }

    if (isMissingAudioStreamError(message)) {
      throw new InfrastructureError(
        "This episode video does not contain an audio track, so a transcript cannot be generated.",
        "MEDIA_AUDIO_STREAM_MISSING",
      );
    }

    throw new InfrastructureError(
      "Failed to extract audio from the episode video for transcription.",
      "TRANSCRIPT_AUDIO_EXTRACTION_FAILED",
    );
  }

  return {
    filePath: outputPath,
    dispose: async () => {
      await fs.rm(tempDirectory, { recursive: true, force: true });
    },
  };
}
