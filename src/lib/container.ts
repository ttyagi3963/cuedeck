import type { IStorageRepository } from "@/repositories/storage/IStorageRepository";
import { LocalStorageRepositoryImpl } from "@/repositories/storage/LocalStorageRepositoryImpl";

import type { IEpisodeRepository } from "@/repositories/episode/IEpisodeRepository";
import { PrismaEpisodeRepositoryImpl } from "@/repositories/episode/PrismaEpisodeRepositoryImpl";

import type { IMarkerRepository } from "@/repositories/marker/IMarkerRepository";
import { PrismaMarkerRepositoryImpl } from "@/repositories/marker/PrismaMarkerRepositoryImpl";

import type { IAdRepository } from "@/repositories/ad/IAdRepository";
import { PrismaAdRepositoryImpl } from "@/repositories/ad/PrismaAdRepositoryImpl";

import type { IJobRepository } from "@/repositories/job/IJobRepository";
import { PrismaJobRepositoryImpl } from "@/repositories/job/PrismaJobRepositoryImpl";

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

import type { IGenerationService } from "@/services/generation/IGenerationService";
import { GenerationServiceImpl } from "@/services/generation/GenerationServiceImpl";
import type { IJobDispatcher } from "@/services/job/IJobDispatcher";
import { InProcessJobDispatcher } from "@/lib/jobs/InProcessJobDispatcher";

const storageRepository: IStorageRepository = new LocalStorageRepositoryImpl();
const episodeRepository: IEpisodeRepository = new PrismaEpisodeRepositoryImpl();
const markerRepository: IMarkerRepository = new PrismaMarkerRepositoryImpl();
const adRepository: IAdRepository = new PrismaAdRepositoryImpl();
const jobRepository: IJobRepository = new PrismaJobRepositoryImpl();

export const storageService: IStorageService = new StorageServiceImpl(
  storageRepository,
);

export const adService: IAdService = new AdServiceImpl(adRepository);
export const markerService: IMarkerService = new MarkerServiceImpl(
  markerRepository,
);
export const episodeService: IEpisodeService = new EpisodeServiceImpl(
  episodeRepository,
);
export const jobService: IJobService = new JobServiceImpl(jobRepository);
const jobDispatcher: IJobDispatcher = new InProcessJobDispatcher(
  jobService,
  storageService,
);
export const generationService: IGenerationService = new GenerationServiceImpl(
  episodeService,
  markerService,
  jobService,
  jobDispatcher,
);
