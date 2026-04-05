import type { IStorageRepository } from "@/repositories/storage/IStorageRepository";
import { LocalStorageRepositoryImpl } from "@/repositories/storage/LocalStorageRepositoryImpl";
import type { IEpisodeRepository } from "@/repositories/episode/IEpisodeRepository";
import { PrismaEpisodeRepositoryImpl } from "@/repositories/episode/PrismaEpisodeRepositoryImpl";
import type { IMarkerRepository } from "@/repositories/marker/IMarkerRepository";
import { PrismaMarkerRepositoryImpl } from "@/repositories/marker/PrismaMarkerRepositoryImpl";

import type { IStorageService } from "@/services/storage/IStorageService";
import { StorageServiceImpl } from "@/services/storage/StorageServiceImpl";

const storageRepository: IStorageRepository = new LocalStorageRepositoryImpl();
const episodeRepository: IEpisodeRepository = new PrismaEpisodeRepositoryImpl();
const markerRepository: IMarkerRepository = new PrismaMarkerRepositoryImpl();

export const storageService: IStorageService = new StorageServiceImpl(
  storageRepository,
);

export { episodeRepository, markerRepository };
