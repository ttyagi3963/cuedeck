import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Episode } from "@/contracts/episode";
import type { Job } from "@/contracts/job";
import { BusinessRuleError, NotFoundError } from "@/contracts/errors";
import type { IAudioProcessor } from "@/services/audio/IAudioProcessor";
import type { IEpisodeService } from "@/services/episode/IEpisodeService";
import type { IJobDispatcher } from "@/services/job/IJobDispatcher";
import type { IJobService } from "@/services/job/IJobService";
import type { IStorageService } from "@/services/storage/IStorageService";
import { TranscriptionServiceImpl } from "@/services/transcription/TranscriptionServiceImpl";

const STUB_EPISODE: Episode = {
  id: "ep1",
  title: "Episode 1",
  sourceUrl: "/videos/test-episode.mp4",
  duration: 1800,
  createdAt: new Date("2026-04-01T00:00:00.000Z"),
  updatedAt: new Date("2026-04-01T00:00:00.000Z"),
};

const STUB_JOB: Job = {
  id: "job1",
  type: "TRANSCRIBE",
  status: "QUEUED",
  episodeId: "ep1",
  progress: 0,
  error: null,
  payload: {
    episodeId: "ep1",
    episodeTitle: "Episode 1",
    sourceUrl: "/videos/test-episode.mp4",
    episodeDuration: 1800,
  },
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
  };
}

function makeAudioProcessor(): IAudioProcessor {
  return {
    probeTranscriptSource: vi.fn().mockResolvedValue({ hasAudioTrack: true }),
    prepareTranscriptAudio: vi.fn(),
  };
}

function makeStorageService(): IStorageService {
  return {
    save: vi.fn(),
    createUploadTarget: vi.fn(),
    getPublicUrl: vi.fn(),
    exists: vi.fn().mockResolvedValue(true),
    delete: vi.fn(),
    provideLocalCopy: vi.fn(),
  };
}

describe("TranscriptionServiceImpl", () => {
  let episodeService: ReturnType<typeof makeEpisodeService>;
  let jobService: ReturnType<typeof makeJobService>;
  let jobDispatcher: ReturnType<typeof makeJobDispatcher>;
  let audioProcessor: ReturnType<typeof makeAudioProcessor>;
  let storageService: ReturnType<typeof makeStorageService>;
  let service: TranscriptionServiceImpl;

  beforeEach(() => {
    episodeService = makeEpisodeService();
    jobService = makeJobService();
    jobDispatcher = makeJobDispatcher();
    audioProcessor = makeAudioProcessor();
    storageService = makeStorageService();
    service = new TranscriptionServiceImpl(
      episodeService,
      jobService,
      jobDispatcher,
      audioProcessor,
      storageService,
    );
  });

  it("throws NotFoundError when the episode does not exist", async () => {
    episodeService.findById = vi.fn().mockResolvedValue(null);

    await expect(service.start("missing")).rejects.toThrow(NotFoundError);
  });

  it("reuses the latest queued transcription job", async () => {
    const inFlightJob: Job = {
      ...STUB_JOB,
      id: "job-in-flight",
      status: "PROCESSING",
      progress: 45,
    };
    jobService.findLatestByEpisodeIdAndType = vi
      .fn()
      .mockResolvedValue(inFlightJob);

    const result = await service.start("ep1");

    expect(result.job).toEqual(inFlightJob);
    expect(jobService.create).not.toHaveBeenCalled();
    expect(jobDispatcher.dispatchTranscription).not.toHaveBeenCalled();
    expect(audioProcessor.probeTranscriptSource).not.toHaveBeenCalled();
  });

  it("rejects transcription when the episode source has no audio track", async () => {
    audioProcessor.probeTranscriptSource = vi
      .fn()
      .mockResolvedValue({ hasAudioTrack: false });

    await expect(service.start("ep1")).rejects.toThrow(BusinessRuleError);
    expect(jobService.create).not.toHaveBeenCalled();
    expect(jobDispatcher.dispatchTranscription).not.toHaveBeenCalled();
  });

  it("creates and dispatches a transcription job when none is running", async () => {
    const result = await service.start("ep1");

    expect(audioProcessor.probeTranscriptSource).toHaveBeenCalledWith(
      "/videos/test-episode.mp4",
      storageService,
    );
    expect(jobService.findLatestByEpisodeIdAndType).toHaveBeenCalledWith(
      "ep1",
      "TRANSCRIBE",
    );
    expect(jobService.create).toHaveBeenCalledWith({
      type: "TRANSCRIBE",
      episodeId: "ep1",
      status: "QUEUED",
      progress: 0,
      payload: {
        episodeId: "ep1",
        episodeTitle: "Episode 1",
        sourceUrl: "/videos/test-episode.mp4",
        episodeDuration: 1800,
      },
      error: null,
      result: null,
    });
    expect(jobDispatcher.dispatchTranscription).toHaveBeenCalledWith("job1");
    expect(result.job).toEqual(STUB_JOB);
  });
});
