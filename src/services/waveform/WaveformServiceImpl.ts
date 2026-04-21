import { NotFoundError } from "@/contracts/errors";
import { jsonValueSchema } from "@/contracts/job";
import {
  waveformJobPayloadSchema,
  type WaveformJobPayload,
} from "@/contracts/waveform";
import type { IEpisodeService } from "@/services/episode/IEpisodeService";
import type { IJobDispatcher } from "@/services/job/IJobDispatcher";
import type { IJobService } from "@/services/job/IJobService";
import type { IWaveformService } from "./IWaveformService";

export class WaveformServiceImpl implements IWaveformService {
  constructor(
    private readonly episodeService: IEpisodeService,
    private readonly jobService: IJobService,
    private readonly jobDispatcher: IJobDispatcher,
  ) {}

  async start(episodeId: string): Promise<void> {
    const episode = await this.episodeService.findById(episodeId);
    if (!episode) {
      throw new NotFoundError("Episode");
    }

    if (episode.waveformUrl) return;

    const latestJob = await this.jobService.findLatestByEpisodeIdAndType(
      episodeId,
      "WAVEFORM",
    );
    if (
      latestJob &&
      (latestJob.status === "QUEUED" || latestJob.status === "PROCESSING")
    ) {
      return;
    }

    const payload = waveformJobPayloadSchema.parse({
      episodeId: episode.id,
      sourceUrl: episode.sourceUrl,
    } satisfies WaveformJobPayload);

    const job = await this.jobService.create({
      type: "WAVEFORM",
      episodeId: episode.id,
      status: "QUEUED",
      progress: 0,
      payload: jsonValueSchema.parse(payload),
      error: null,
      result: null,
    });

    await this.jobDispatcher.dispatchWaveform(job.id);
  }
}
