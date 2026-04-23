import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Episode } from "@/contracts/episode";
import type { Job } from "@/contracts/job";
import { NotFoundError } from "@/contracts/errors";
import type { IEpisodeService } from "@/services/episode/IEpisodeService";
import type { IJobDispatcher } from "@/services/job/IJobDispatcher";
import type { IJobService } from "@/services/job/IJobService";
import { WaveformServiceImpl } from "@/services/waveform/WaveformServiceImpl";

const STUB_EPISODE: Episode = {
  id: "ep1",
  title: "Episode 1",
  sourceUrl: "/videos/test-episode.mp4",
  duration: 1800,
  waveformUrl: null,
  createdAt: new Date("2026-04-01T00:00:00.000Z"),
  updatedAt: new Date("2026-04-01T00:00:00.000Z"),
};

const STUB_JOB: Job = {
  id: "job1",
  type: "WAVEFORM",
  status: "QUEUED",
  episodeId: "ep1",
  progress: 0,
  error: null,
  payload: { episodeId: "ep1", sourceUrl: STUB_EPISODE.sourceUrl },
  result: null,
  retryCount: 0,
  maxRetries: 3,
  startedAt: null,
  completedAt: null,
  createdAt: new Date("2026-04-01T00:00:00.000Z"),
  updatedAt: new Date("2026-04-01T00:00:00.000Z"),
};

function makeEpisodeService(): IEpisodeService {
  return {
    findAll: vi.fn().mockResolvedValue([STUB_EPISODE]),
    findById: vi.fn().mockResolvedValue(STUB_EPISODE),
    create: vi.fn(),
    delete: vi.fn(),
  };
}

function makeJobService(): IJobService {
  return {
    findById: vi.fn().mockResolvedValue(STUB_JOB),
    findLatestByEpisodeIdAndType: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(STUB_JOB),
    update: vi.fn().mockResolvedValue(STUB_JOB),
    claimNextRunnable: vi.fn(),
    failStaleProcessingJobs: vi.fn().mockResolvedValue(0),
    heartbeat: vi.fn().mockResolvedValue(undefined),
  };
}

function makeJobDispatcher(): IJobDispatcher {
  return {
    dispatchGenerateVideo: vi.fn().mockResolvedValue(undefined),
    dispatchTranscription: vi.fn().mockResolvedValue(undefined),
    dispatchWaveform: vi.fn().mockResolvedValue(undefined),
  };
}

describe("WaveformServiceImpl.start", () => {
  let episodeService: IEpisodeService;
  let jobService: IJobService;
  let jobDispatcher: IJobDispatcher;
  let service: WaveformServiceImpl;

  beforeEach(() => {
    episodeService = makeEpisodeService();
    jobService = makeJobService();
    jobDispatcher = makeJobDispatcher();
    service = new WaveformServiceImpl(episodeService, jobService, jobDispatcher);
  });

  it("throws NotFoundError when episode does not exist", async () => {
    vi.mocked(episodeService.findById).mockResolvedValueOnce(null);
    await expect(service.start("missing")).rejects.toBeInstanceOf(NotFoundError);
    expect(jobService.create).not.toHaveBeenCalled();
    expect(jobDispatcher.dispatchWaveform).not.toHaveBeenCalled();
  });

  it("skips when episode already has a waveformUrl", async () => {
    vi.mocked(episodeService.findById).mockResolvedValueOnce({
      ...STUB_EPISODE,
      waveformUrl: "https://cdn/waveforms/ep1.dat",
    });
    await service.start("ep1");
    expect(jobService.create).not.toHaveBeenCalled();
    expect(jobDispatcher.dispatchWaveform).not.toHaveBeenCalled();
  });

  it("skips when a QUEUED waveform job already exists", async () => {
    vi.mocked(jobService.findLatestByEpisodeIdAndType).mockResolvedValueOnce({
      ...STUB_JOB,
      status: "QUEUED",
    });
    await service.start("ep1");
    expect(jobService.create).not.toHaveBeenCalled();
    expect(jobDispatcher.dispatchWaveform).not.toHaveBeenCalled();
  });

  it("skips when a PROCESSING waveform job already exists", async () => {
    vi.mocked(jobService.findLatestByEpisodeIdAndType).mockResolvedValueOnce({
      ...STUB_JOB,
      status: "PROCESSING",
    });
    await service.start("ep1");
    expect(jobService.create).not.toHaveBeenCalled();
    expect(jobDispatcher.dispatchWaveform).not.toHaveBeenCalled();
  });

  it("re-enqueues after a prior FAILED attempt", async () => {
    vi.mocked(jobService.findLatestByEpisodeIdAndType).mockResolvedValueOnce({
      ...STUB_JOB,
      status: "FAILED",
    });
    await service.start("ep1");
    expect(jobService.create).toHaveBeenCalledTimes(1);
    expect(jobDispatcher.dispatchWaveform).toHaveBeenCalledWith("job1");
  });

  it("creates a WAVEFORM job with the correct payload on happy path", async () => {
    await service.start("ep1");
    expect(jobService.create).toHaveBeenCalledWith({
      type: "WAVEFORM",
      episodeId: "ep1",
      status: "QUEUED",
      progress: 0,
      payload: {
        episodeId: "ep1",
        sourceUrl: "/videos/test-episode.mp4",
      },
      error: null,
      result: null,
    });
    expect(jobDispatcher.dispatchWaveform).toHaveBeenCalledWith("job1");
  });
});
