import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { TranscriptionResult } from "@/contracts/transcript";
import { transcriptionResultSchema } from "@/contracts/transcript";
import { InfrastructureError } from "@/lib/errors/InfrastructureError";
import type { ITranscriptionProvider } from "./ITranscriptionProvider";

const openAiTranscriptResponseSchema = z.object({
  language: z.string().nullish(),
  duration: z.number().nullish(),
  text: z.string().optional(),
  segments: z
    .array(
      z.object({
        start: z.number(),
        end: z.number(),
        text: z.string(),
        avg_logprob: z.number().optional(),
      }),
    )
    .default([]),
});

function getAudioContentType(filePath: string) {
  switch (path.extname(filePath).toLowerCase()) {
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".m4a":
      return "audio/mp4";
    default:
      return "application/octet-stream";
  }
}

function toConfidence(avgLogprob?: number) {
  if (avgLogprob === undefined) {
    return 1;
  }

  return Math.max(0, Math.min(1, Math.exp(avgLogprob)));
}

type OpenAiTranscriptionProviderOptions = {
  apiKey: string;
  baseUrl?: string;
  model?: string;
};

export class OpenAiTranscriptionProvider implements ITranscriptionProvider {
  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly model: string;

  constructor(options: OpenAiTranscriptionProviderOptions) {
    this.apiKey = options.apiKey;
    this.endpoint = `${options.baseUrl ?? "https://api.openai.com/v1"}/audio/transcriptions`;
    this.model = options.model ?? "whisper-1";
  }

  async transcribe(audioFilePath: string): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      throw new InfrastructureError(
        "OPENAI_API_KEY is required for transcript generation",
        "OPENAI_API_KEY_MISSING",
      );
    }

    const audioBuffer = await fs.readFile(audioFilePath);
    const formData = new FormData();

    formData.set("model", this.model);
    formData.set("response_format", "verbose_json");
    formData.append("timestamp_granularities[]", "segment");
    formData.set("file", new Blob([audioBuffer], {
      type: getAudioContentType(audioFilePath),
    }), path.basename(audioFilePath));

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new InfrastructureError(
        `OpenAI transcription failed (${response.status}): ${message}`,
        "OPENAI_TRANSCRIPTION_FAILED",
      );
    }

    const rawResponse = openAiTranscriptResponseSchema.parse(await response.json());
    const segments =
      rawResponse.segments.length > 0
        ? rawResponse.segments.map((segment) => ({
            startTime: segment.start,
            endTime: segment.end,
            text: segment.text.trim(),
            confidence: toConfidence(segment.avg_logprob),
          }))
        : [
            {
              startTime: 0,
              endTime: rawResponse.duration ?? 0,
              text: rawResponse.text?.trim() || "Transcript unavailable",
              confidence: 1,
            },
          ];

    return transcriptionResultSchema.parse({
      language: rawResponse.language ?? null,
      duration: rawResponse.duration ?? null,
      segments: segments.filter((segment) => segment.text.length > 0),
    });
  }
}
