// src/services/storage/StorageServiceImpl.ts

import type { IStorageService } from "./IStorageService";
import type { IStorageRepository } from "@/repositories/storage/IStorageRepository";
import type {
  CreateUploadTargetInput,
  SaveFileInput,
  StoredFile,
  UploadTarget,
} from "@/contracts/storage/storage.types";

export class StorageServiceImpl implements IStorageService {
  constructor(private readonly storageRepository: IStorageRepository) {}

  async save(file: SaveFileInput): Promise<StoredFile> {
    return this.storageRepository.save(file);
  }

  async createUploadTarget(file: CreateUploadTargetInput): Promise<UploadTarget> {
    return this.storageRepository.createUploadTarget(file);
  }

  async getPublicUrl(path: string): Promise<string> {
    return this.storageRepository.getPublicUrl(path);
  }

  async exists(path: string): Promise<boolean> {
    return this.storageRepository.exists(path);
  }

  async delete(path: string): Promise<void> {
    return this.storageRepository.delete(path);
  }

  async provideLocalCopy(url: string): Promise<string> {
    return this.storageRepository.provideLocalCopy(url);
  }
}
