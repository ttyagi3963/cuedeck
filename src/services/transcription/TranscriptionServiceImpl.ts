import { BusinessRuleError, NotFoundError } from "@/contracts/errors";
import { jsonValueSchema } from "@/contracts/job";
import type {
  StartTranscriptionResult,
  TranscriptJobPayload,
} from "@/contracts/transcript";
import { transcriptJobPayloadSchema } from "@/contracts/transcript";
import type { IAudioProcessor } from "@/services/audio/IAudioProcessor";
import type { IEpisodeService } from "@/services/episode/IEpisodeService";
import type { IJobDispatcher } from "@/services/job/IJobDispatcher";
import type { IJobService } from "@/services/job/IJobService";
import type { IStorageService } from "@/services/storage/IStorageService";
import type { ITranscriptionService } from "./ITranscriptionService";

export class TranscriptionServiceImpl implements ITranscriptionService {
  constructor(
    private readonly episodeService: IEpisodeService,
    private readonly jobService: IJobService,
    private readonly jobDispatcher: IJobDispatcher,
    private readonly audioProcessor: IAudioProcessor,
    private readonly storageService: IStorageService,
  ) {}

  async start(episodeId: string): Promise<StartTranscriptionResult> {
    const episode = await this.episodeService.findById(episodeId);
    if (!episode) {
      throw new NotFoundError("Episode");
    }

    const latestJob = await this.jobService.findLatestByEpisodeIdAndType(
      episodeId,
      "TRANSCRIBE",
    );
    if (
      latestJob &&
      (latestJob.status === "QUEUED" || latestJob.status === "PROCESSING")
    ) {
      return { job: latestJob };
    }

    const transcriptSource = await this.audioProcessor.probeTranscriptSource(
      episode.sourceUrl,
      this.storageService,
    );
    if (!transcriptSource.hasAudioTrack) {
      throw new BusinessRuleError(
        "This episode video does not contain an audio track, so a transcript cannot be generated.",
        "TRANSCRIPT_AUDIO_TRACK_REQUIRED",
      );
    }

    const payload = transcriptJobPayloadSchema.parse({
      episodeId: episode.id,
      episodeTitle: episode.title,
      sourceUrl: episode.sourceUrl,
      episodeDuration: episode.duration,
    } satisfies TranscriptJobPayload);

    const job = await this.jobService.create({
      type: "TRANSCRIBE",
      episodeId: episode.id,
      status: "QUEUED",
      progress: 0,
      payload: jsonValueSchema.parse(payload),
      error: null,
      result: null,
    });

    await this.jobDispatcher.dispatchTranscription(job.id);

    return { job };
  }
}
