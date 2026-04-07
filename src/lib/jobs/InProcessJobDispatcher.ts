import "server-only";

import {
  generationJobResultSchema,
  generationPlanSchema,
} from "@/contracts/generation";
import type { IJobDispatcher } from "@/services/job/IJobDispatcher";
import type { IJobService } from "@/services/job/IJobService";
import type { IStorageService } from "@/services/storage/IStorageService";
import { generateFinalVideo } from "@/lib/pipeline/generateFinalVideo";

export class InProcessJobDispatcher implements IJobDispatcher {
  constructor(
    private readonly jobService: IJobService,
    private readonly storageService: IStorageService,
  ) {}

  async dispatchGenerateVideo(jobId: string): Promise<void> {
    queueMicrotask(() => {
      void this.runGenerateVideo(jobId);
    });
  }

  private async runGenerateVideo(jobId: string) {
    try {
      const job = await this.jobService.findById(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      const plan = generationPlanSchema.parse(job.payload);

      await this.jobService.update(jobId, {
        status: "PROCESSING",
        progress: 5,
        error: null,
        startedAt: new Date(),
        completedAt: null,
      });

      const result = await generateFinalVideo(plan, this.storageService);

      await this.jobService.update(jobId, {
        status: "COMPLETED",
        progress: 100,
        error: null,
        result: generationJobResultSchema.parse(result),
        completedAt: new Date(),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Video generation failed";

      try {
        await this.jobService.update(jobId, {
          status: "FAILED",
          error: message,
          completedAt: new Date(),
        });
      } catch (updateError) {
        console.error("Failed to update generation job status", updateError);
      }
    }
  }
}
