import type { IJobService } from "@/services/job/IJobService";
import type { JobProcessor } from "./JobProcessor";

const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_STALE_AFTER_MS = 2 * 60 * 1000;

export class DurableJobWorker {
  private isRunning = false;
  private pollTimeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly jobService: IJobService,
    private readonly jobProcessor: JobProcessor,
    private readonly pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    private readonly staleAfterMs = DEFAULT_STALE_AFTER_MS,
  ) {}

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[DurableJobWorker] Started");
    void this.poll();
  }

  stop(): void {
    this.isRunning = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    console.log("[DurableJobWorker] Stopped");
  }

  private async poll(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const staleBefore = new Date(Date.now() - this.staleAfterMs);
      const failedCount = await this.jobService.failStaleProcessingJobs(staleBefore);

      if (failedCount > 0) {
        console.warn(
          `[DurableJobWorker] Marked ${failedCount} stale job${failedCount === 1 ? "" : "s"} as failed`,
        );
      }

      while (this.isRunning) {
        const nextJob = await this.jobService.claimNextRunnable(staleBefore);
        if (!nextJob) {
          break;
        }

        console.log(`[DurableJobWorker] Processing job: ${nextJob.id} (${nextJob.type})`);
        await this.jobProcessor.process(nextJob.id);
      }
    } catch (error) {
      console.error("[DurableJobWorker] Error during polling", error);
    }

    if (this.isRunning) {
      this.pollTimeout = setTimeout(() => void this.poll(), this.pollIntervalMs);
    }
  }
}
