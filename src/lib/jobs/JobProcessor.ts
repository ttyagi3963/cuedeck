import {
  generationJobResultSchema,
  generationPlanSchema,
} from "@/contracts/generation";
import {
  transcriptJobPayloadSchema,
  transcriptJobResultSchema,
  transcriptionResultSchema,
} from "@/contracts/transcript";
import type { IJobService } from "@/services/job/IJobService";
import type { ITranscriptService } from "@/services/transcript/ITranscriptService";
import type { IAudioProcessor } from "@/services/audio/IAudioProcessor";
import type { IStorageService } from "@/services/storage/IStorageService";
import type { IVideoProcessor } from "@/services/video/IVideoProcessor";
import type { ITranscriptionProvider } from "@/services/transcription/ITranscriptionProvider";
import { InfrastructureError } from "../errors/InfrastructureError";

const DEFAULT_HEARTBEAT_INTERVAL_MS = 10_000;

export class JobProcessor {
  constructor(
    private readonly jobService: IJobService,
    private readonly transcriptService: ITranscriptService,
    private readonly storageService: IStorageService,
    private readonly audioProcessor: IAudioProcessor,
    private readonly videoProcessor: IVideoProcessor,
    private readonly transcriptionProvider: ITranscriptionProvider,
    private readonly heartbeatIntervalMs = DEFAULT_HEARTBEAT_INTERVAL_MS,
  ) {}

  async process(jobId: string): Promise<void> {
    const job = await this.jobService.findById(jobId);
    if (!job) {
      throw new InfrastructureError(`Job ${jobId} not found`, "JOB_NOT_FOUND");
    }

    if (job.status === "COMPLETED" || job.status === "FAILED") {
      return;
    }

    switch (job.type) {
      case "GENERATE_VIDEO":
        await this.runGenerateVideo(jobId);
        break;
      case "TRANSCRIBE":
        await this.runTranscription(jobId);
        break;
      default:
        throw new InfrastructureError(`Unsupported job type: ${job.type}`, "UNSUPPORTED_JOB_TYPE");
    }
  }

  private async runGenerateVideo(jobId: string) {
    const stopHeartbeat = this.startHeartbeat(jobId);

    try {
      const job = await this.jobService.findById(jobId);
      if (!job) throw new Error(`Job ${jobId} not found`);

      const plan = generationPlanSchema.parse(job.payload);

      await this.jobService.update(jobId, {
        status: "PROCESSING",
        progress: 5,
        error: null,
        result: null,
        startedAt: job.startedAt ?? new Date(),
        completedAt: null,
      });

      const finalVideoResult = await this.videoProcessor.generateFinalVideo(plan, this.storageService);
      const partialResult = generationJobResultSchema.parse({
        ...finalVideoResult,
        hlsPackage: null,
      });

      await this.jobService.update(jobId, {
        progress: 65,
        result: partialResult,
      });

      const hlsPackage = await this.videoProcessor.generateHlsStream(
        plan.episodeId,
        finalVideoResult.storedFile,
        this.storageService,
      );
      const result = generationJobResultSchema.parse({
        ...finalVideoResult,
        hlsPackage,
      });

      await this.jobService.update(jobId, {
        status: "COMPLETED",
        progress: 100,
        error: null,
        result,
        completedAt: new Date(),
      });
    } catch (error) {
      await this.handleFailure(jobId, error, "Video generation failed");
    } finally {
      stopHeartbeat();
    }
  }

  private async runTranscription(jobId: string) {
    const stopHeartbeat = this.startHeartbeat(jobId);
    let preparedAudio: Awaited<ReturnType<IAudioProcessor["prepareTranscriptAudio"]>> | null = null;

    try {
      const job = await this.jobService.findById(jobId);
      if (!job) throw new Error(`Job ${jobId} not found`);

      const payload = transcriptJobPayloadSchema.parse(job.payload);

      await this.jobService.update(jobId, {
        status: "PROCESSING",
        progress: 5,
        error: null,
        result: null,
        startedAt: job.startedAt ?? new Date(),
        completedAt: null,
      });

      preparedAudio = await this.audioProcessor.prepareTranscriptAudio(
        payload.sourceUrl,
        this.storageService,
      );

      await this.jobService.update(jobId, { progress: 35 });

      const transcription = transcriptionResultSchema.parse(
        await this.transcriptionProvider.transcribe(preparedAudio.filePath, payload),
      );

      await this.jobService.update(jobId, { progress: 80 });

      const persistedSegments = await this.transcriptService.replaceForEpisode(
        payload.episodeId,
        transcription.segments,
      );
      const result = transcriptJobResultSchema.parse({
        segmentCount: persistedSegments.length,
        language: transcription.language,
        duration: transcription.duration,
      });

      await this.jobService.update(jobId, {
        status: "COMPLETED",
        progress: 100,
        error: null,
        result,
        completedAt: new Date(),
      });
    } catch (error) {
      await this.handleFailure(jobId, error, "Transcription failed");
    } finally {
      stopHeartbeat();
      await preparedAudio?.dispose();
    }
  }

  private startHeartbeat(jobId: string) {
    const interval = setInterval(() => {
      void this.jobService.heartbeat(jobId).catch((error) => {
        console.error(`[JobProcessor] Failed to heartbeat job ${jobId}`, error);
      });
    }, this.heartbeatIntervalMs);

    interval.unref?.();

    return () => clearInterval(interval);
  }

  private async handleFailure(jobId: string, error: unknown, defaultMessage: string) {
    const message = error instanceof Error ? error.message : defaultMessage;
    try {
      await this.jobService.update(jobId, {
        status: "FAILED",
        error: message,
        completedAt: new Date(),
      });
    } catch (updateError) {
      console.error(`Failed to update job ${jobId} status to FAILED`, updateError);
    }
  }
}
