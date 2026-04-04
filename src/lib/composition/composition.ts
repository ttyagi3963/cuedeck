import type { IStorageRepository } from "@/repositories/storage/IStorageRepository";
import { LocalStorageRepositoryImpl } from "@/repositories/storage/LocalStorageRepositoryImpl";

import type { IStorageService } from "@/services/storage/IStorageService";
import { StorageServiceImpl } from "@/services/storage/StorageServiceImpl";

const storageRepository: IStorageRepository = new LocalStorageRepositoryImpl();

export const storageService: IStorageService = new StorageServiceImpl(
  storageRepository,
);
