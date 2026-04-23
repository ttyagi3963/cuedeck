import type { IStorageRepository } from "@/repositories/storage/IStorageRepository";
import { LocalStorageRepositoryImpl } from "@/repositories/storage/LocalStorageRepositoryImpl";
import { R2StorageRepositoryImpl } from "@/repositories/storage/R2StorageRepositoryImpl";

import type { IEpisodeRepository } from "@/repositories/episode/IEpisodeRepository";
import { PrismaEpisodeRepositoryImpl } from "@/repositories/episode/PrismaEpisodeRepositoryImpl";

import type { IMarkerRepository } from "@/repositories/marker/IMarkerRepository";
import { PrismaMarkerRepositoryImpl } from "@/repositories/marker/PrismaMarkerRepositoryImpl";

import type { IAdRepository } from "@/repositories/ad/IAdRepository";
import { PrismaAdRepositoryImpl } from "@/repositories/ad/PrismaAdRepositoryImpl";

import type { IJobRepository } from "@/repositories/job/IJobRepository";
import { PrismaJobRepositoryImpl } from "@/repositories/job/PrismaJobRepositoryImpl";

import type { ITranscriptRepository } from "@/repositories/transcript/ITranscriptRepository";
import { PrismaTranscriptRepositoryImpl } from "@/repositories/transcript/PrismaTranscriptRepositoryImpl";

import type { IStorageService } from "@/services/storage/IStorageService";
import { StorageServiceImpl } from "@/services/storage/StorageServiceImpl";

import type { IAdService } from "@/services/ad/IAdService";
import { AdServiceImpl } from "@/services/ad/AdServiceImpl";

import type { IMarkerService } from "@/services/marker/IMarkerService";
import { MarkerServiceImpl } from "@/services/marker/MarkerServiceImpl";

import type { IEpisodeService } from "@/services/episode/IEpisodeService";
import { EpisodeServiceImpl } from "@/services/episode/EpisodeServiceImpl";

import type { IJobService } from "@/services/job/IJobService";
import { JobServiceImpl } from "@/services/job/JobServiceImpl";

import type { ITranscriptService } from "@/services/transcript/ITranscriptService";
import { TranscriptServiceImpl } from "@/services/transcript/TranscriptServiceImpl";

import type { IGenerationService } from "@/services/generation/IGenerationService";
import { GenerationServiceImpl } from "@/services/generation/GenerationServiceImpl";
import type { ITranscriptionService } from "@/services/transcription/ITranscriptionService";
import { TranscriptionServiceImpl } from "@/services/transcription/TranscriptionServiceImpl";
import type { IWaveformService } from "@/services/waveform/IWaveformService";
import { WaveformServiceImpl } from "@/services/waveform/WaveformServiceImpl";
import type { IJobDispatcher } from "@/services/job/IJobDispatcher";
import { DurableJobDispatcher } from "@/lib/jobs/DurableJobDispatcher";
import { DurableJobWorker } from "@/lib/jobs/DurableJobWorker";
import { JobProcessor } from "@/lib/jobs/JobProcessor";
import type { IAudioProcessor } from "@/services/audio/IAudioProcessor";
import { FfmpegAudioProcessorImpl } from "@/services/audio/FfmpegAudioProcessorImpl";
import type { IAudioPeaksProcessor } from "@/services/audio/IAudioPeaksProcessor";
import { FfmpegAudioPeaksProcessorImpl } from "@/services/audio/FfmpegAudioPeaksProcessorImpl";
import type { IVideoProcessor } from "@/services/video/IVideoProcessor";
import { FfmpegVideoProcessorImpl } from "@/services/video/FfmpegVideoProcessorImpl";
import type { ITranscriptionProvider } from "@/services/transcription/ITranscriptionProvider";
import { OpenAiTranscriptionProvider } from "@/services/transcription/OpenAiTranscriptionProvider";
import { STORAGE_BUCKETS } from "@/contracts/storage";
import { InfrastructureError } from "@/lib/errors/InfrastructureError";

// Storage Configuration
const storageProvider = (process.env.STORAGE_PROVIDER ?? "local").trim().toLowerCase();

function readStorageEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

const r2AccountId = readStorageEnv("R2_ACCOUNT_ID");
const r2AccessKeyId = readStorageEnv("R2_ACCESS_KEY_ID");
const r2SecretAccessKey = readStorageEnv("R2_SECRET_ACCESS_KEY");
const r2PrivateBucketName = readStorageEnv("R2_PRIVATE_BUCKET");
const r2PublicBucketName = readStorageEnv("R2_PUBLIC_BUCKET");
const r2PublicBaseUrl = readStorageEnv("R2_PUBLIC_BASE_URL");
const r2Endpoint = readStorageEnv("R2_ENDPOINT");

if (storageProvider === "r2") {
  const missingVariables = [
    !r2AccountId ? "R2_ACCOUNT_ID" : null,
    !r2AccessKeyId ? "R2_ACCESS_KEY_ID" : null,
    !r2SecretAccessKey ? "R2_SECRET_ACCESS_KEY" : null,
    !r2PrivateBucketName ? "R2_PRIVATE_BUCKET" : null,
    !r2PublicBucketName ? "R2_PUBLIC_BUCKET" : null,
    !r2PublicBaseUrl ? "R2_PUBLIC_BASE_URL" : null,
  ].filter((value): value is string => value !== null);

  if (missingVariables.length > 0) {
    throw new InfrastructureError(
      `Missing required R2 environment variables: ${missingVariables.join(", ")}`,
      "R2_CONFIGURATION_ERROR",
    );
  }
}

const storageRepository: IStorageRepository =
  storageProvider === "r2"
    ? new R2StorageRepositoryImpl({
        accountId: r2AccountId,
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
        privateBucketName: r2PrivateBucketName,
        publicBucketName: r2PublicBucketName,
        publicBuckets: STORAGE_BUCKETS.filter((b) => b === "generated"),
        publicBaseUrl: r2PublicBaseUrl,
        endpoint: r2Endpoint || undefined,
      })
    : new LocalStorageRepositoryImpl();

const episodeRepository: IEpisodeRepository = new PrismaEpisodeRepositoryImpl();
const markerRepository: IMarkerRepository = new PrismaMarkerRepositoryImpl();
const adRepository: IAdRepository = new PrismaAdRepositoryImpl();
const jobRepository: IJobRepository = new PrismaJobRepositoryImpl();
const transcriptRepository: ITranscriptRepository =
  new PrismaTranscriptRepositoryImpl();
const audioProcessor: IAudioProcessor = new FfmpegAudioProcessorImpl();
const audioPeaksProcessor: IAudioPeaksProcessor = new FfmpegAudioPeaksProcessorImpl();
const videoProcessor: IVideoProcessor = new FfmpegVideoProcessorImpl();

export const storageService: IStorageService = new StorageServiceImpl(
  storageRepository,
);

const transcriptionProvider: ITranscriptionProvider =
  new OpenAiTranscriptionProvider({
    apiKey: process.env.OPENAI_API_KEY ?? "",
    baseUrl: process.env.OPENAI_API_BASE_URL,
    model: process.env.OPENAI_TRANSCRIPTION_MODEL ?? "whisper-1",
  });

export const adService: IAdService = new AdServiceImpl(adRepository);
export const markerService: IMarkerService = new MarkerServiceImpl(
  markerRepository,
);
export const episodeService: IEpisodeService = new EpisodeServiceImpl(
  episodeRepository,
);
export const jobService: IJobService = new JobServiceImpl(jobRepository);
export const transcriptService: ITranscriptService = new TranscriptServiceImpl(
  transcriptRepository,
);

// Durable Job Worker Setup
const jobProcessor = new JobProcessor(
  jobService,
  transcriptService,
  storageService,
  audioProcessor,
  videoProcessor,
  transcriptionProvider,
  episodeRepository,
  audioPeaksProcessor,
);

const jobDispatcher: IJobDispatcher = new DurableJobDispatcher();

// Store the worker on `process` (truly process-global in Node) rather than
// globalThis, because Next.js dev-mode can isolate globalThis per route
// evaluation, causing the singleton guard to miss and spin up duplicate
// workers on every API hit. `process` is the one object Node guarantees
// is shared across every module evaluation within a single process.
type ProcessWithWorker = typeof process & {
  __cuedeckDurableJobWorker?: DurableJobWorker;
};

export function startDurableJobWorker() {
  const p = process as ProcessWithWorker;
  if (p.__cuedeckDurableJobWorker) {
    return p.__cuedeckDurableJobWorker;
  }

  const worker = new DurableJobWorker(jobService, jobProcessor);
  worker.start();
  p.__cuedeckDurableJobWorker = worker;
  return worker;
}

// Autostart the durable worker in development by default, opt-in elsewhere.
// - dev: on unless JOB_WORKER_AUTOSTART=false
// - prod: off unless JOB_WORKER_AUTOSTART=true (separate `jobs:worker` process)
// - test: off unless JOB_WORKER_AUTOSTART=true
const autostartFlag = (process.env.JOB_WORKER_AUTOSTART ?? "").trim().toLowerCase();
const autostartDefault = process.env.NODE_ENV === "development";
const shouldAutostart =
  autostartFlag === "true" || (autostartFlag === "" && autostartDefault);

if (typeof window === "undefined" && shouldAutostart) {
  startDurableJobWorker();
}

export const generationService: IGenerationService = new GenerationServiceImpl(
  episodeService,
  markerService,
  jobService,
  jobDispatcher,
);

export const transcriptionService: ITranscriptionService =
  new TranscriptionServiceImpl(
    episodeService,
    jobService,
    jobDispatcher,
    audioProcessor,
    storageService,
  );

export const waveformService: IWaveformService = new WaveformServiceImpl(
  episodeService,
  jobService,
  jobDispatcher,
);
