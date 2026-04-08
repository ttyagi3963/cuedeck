import type {
  CreateUploadTargetInput,
  SaveFileInput,
  StoredFile,
  UploadTarget,
} from "@/contracts/storage/storage.types";

export interface IStorageRepository {
  save(file: SaveFileInput): Promise<StoredFile>;
  createUploadTarget(file: CreateUploadTargetInput): Promise<UploadTarget>;
  getPublicUrl(path: string): Promise<string>;
  exists(path: string): Promise<boolean>;
  delete(path: string): Promise<void>;
  provideLocalCopy(url: string): Promise<string>;
}
