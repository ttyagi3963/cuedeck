// src/services/storage/StorageServiceImpl.ts

import type { IStorageService } from "./IStorageService";
import type { IStorageRepository } from "@/repositories/storage/IStorageRepository";
import type {
  SaveFileInput,
  StoredFile,
} from "@/contracts/storage/storage.types";

export class StorageServiceImpl implements IStorageService {
  constructor(private readonly storageRepository: IStorageRepository) {}

  async save(file: SaveFileInput): Promise<StoredFile> {
    return this.storageRepository.save(file);
  }

  async getPublicUrl(path: string): Promise<string> {
    return this.storageRepository.getPublicUrl(path);
  }
}
