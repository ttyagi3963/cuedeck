import type {
  SaveFileInput,
  StoredFile,
  StorageBucket,
} from "@/contracts/storage/storage.types";

export interface IStorageRepository {
  save(file: SaveFileInput): Promise<StoredFile>;
  getPublicUrl(path: string): Promise<string>;
}
