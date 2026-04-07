import type {
  StartGenerationResult,
} from "@/contracts/generation";
import { createGenerationPlan } from "@/contracts/generation";
import { NotFoundError } from "@/contracts/errors";
import { jsonValueSchema } from "@/contracts/job";
import type { IEpisodeService } from "@/services/episode/IEpisodeService";
import type { IMarkerService } from "@/services/marker/IMarkerService";
import type { IJobDispatcher } from "@/services/job/IJobDispatcher";
import type { IJobService } from "@/services/job/IJobService";
import type { IGenerationService } from "./IGenerationService";

export class GenerationServiceImpl implements IGenerationService {
  constructor(
    private readonly episodeService: IEpisodeService,
    private readonly markerService: IMarkerService,
    private readonly jobService: IJobService,
    private readonly jobDispatcher: IJobDispatcher,
  ) {}

  async start(episodeId: string): Promise<StartGenerationResult> {
    const episode = await this.episodeService.findById(episodeId);
    if (!episode) {
      throw new NotFoundError("Episode");
    }

    const markers = await this.markerService.findByEpisodeId(episodeId);
    const plan = createGenerationPlan(episode, markers);

    const job = await this.jobService.create({
      type: "GENERATE_VIDEO",
      episodeId: episode.id,
      status: "QUEUED",
      progress: 0,
      payload: jsonValueSchema.parse(plan),
    });

    await this.jobDispatcher.dispatchGenerateVideo(job.id);

    return {
      job,
      plan,
    };
  }
}
