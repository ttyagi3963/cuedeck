import type {
  SaveFileInput,
  StoredFile,
} from "@/contracts/storage/storage.types";

export interface IStorageRepository {
  save(file: SaveFileInput): Promise<StoredFile>;
  getPublicUrl(path: string): Promise<string>;
  delete(path: string): Promise<void>;
}
