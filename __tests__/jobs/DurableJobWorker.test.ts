import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Job } from "@/contracts/job";
import type { IJobService } from "@/services/job/IJobService";
import { DurableJobWorker } from "@/lib/jobs/DurableJobWorker";
import type { JobProcessor } from "@/lib/jobs/JobProcessor";

const STUB_JOB: Job = {
  id: "job-1",
  type: "GENERATE_VIDEO",
  status: "PROCESSING",
  episodeId: "episode-1",
  progress: 0,
  error: null,
  payload: null,
  result: null,
  retryCount: 0,
  maxRetries: 3,
  startedAt: new Date("2026-04-01T00:00:00.000Z"),
  completedAt: null,
  createdAt: new Date("2026-04-01T00:00:00.000Z"),
  updatedAt: new Date("2026-04-01T00:00:00.000Z"),
};

function makeJobService(): IJobService {
  return {
    findById: vi.fn(),
    findLatestByEpisodeIdAndType: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    claimNextRunnable: vi.fn(),
    failStaleProcessingJobs: vi.fn().mockResolvedValue(0),
    heartbeat: vi.fn(),
  };
}

describe("DurableJobWorker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fails stale jobs before claiming and drains available queued work", async () => {
    const jobService = makeJobService();
    jobService.claimNextRunnable = vi
      .fn()
      .mockResolvedValueOnce(STUB_JOB)
      .mockResolvedValueOnce(null);
    const jobProcessor = {
      process: vi.fn().mockResolvedValue(undefined),
    } as unknown as JobProcessor;

    const worker = new DurableJobWorker(jobService, jobProcessor, 5000, 60_000);
    worker.start();

    for (let index = 0; index < 5; index += 1) {
      await Promise.resolve();
    }

    expect(jobService.failStaleProcessingJobs).toHaveBeenCalledTimes(1);
    expect(jobService.claimNextRunnable).toHaveBeenCalledTimes(2);
    expect(jobProcessor.process).toHaveBeenCalledWith(STUB_JOB.id);

    worker.stop();
  });
});
