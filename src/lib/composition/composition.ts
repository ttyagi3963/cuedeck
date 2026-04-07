import type { IStorageRepository } from "@/repositories/storage/IStorageRepository";
import { LocalStorageRepositoryImpl } from "@/repositories/storage/LocalStorageRepositoryImpl";

import type { IEpisodeRepository } from "@/repositories/episode/IEpisodeRepository";
import { PrismaEpisodeRepositoryImpl } from "@/repositories/episode/PrismaEpisodeRepositoryImpl";

import type { IMarkerRepository } from "@/repositories/marker/IMarkerRepository";
import { PrismaMarkerRepositoryImpl } from "@/repositories/marker/PrismaMarkerRepositoryImpl";

import type { IAdRepository } from "@/repositories/ad/IAdRepository";
import { PrismaAdRepositoryImpl } from "@/repositories/ad/PrismaAdRepositoryImpl";

import type { IStorageService } from "@/services/storage/IStorageService";
import { StorageServiceImpl } from "@/services/storage/StorageServiceImpl";

import type { IAdService } from "@/services/ad/IAdService";
import { AdServiceImpl } from "@/services/ad/AdServiceImpl";

import type { IMarkerService } from "@/services/marker/IMarkerService";
import { MarkerServiceImpl } from "@/services/marker/MarkerServiceImpl";

import type { IEpisodeService } from "@/services/episode/IEpisodeService";
import { EpisodeServiceImpl } from "@/services/episode/EpisodeServiceImpl";

const storageRepository: IStorageRepository = new LocalStorageRepositoryImpl();
const episodeRepository: IEpisodeRepository = new PrismaEpisodeRepositoryImpl();
const markerRepository: IMarkerRepository = new PrismaMarkerRepositoryImpl();
const adRepository: IAdRepository = new PrismaAdRepositoryImpl();

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
