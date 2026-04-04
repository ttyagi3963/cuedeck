import type {
  SaveFileInput,
  StoredFile,
} from "@/contracts/storage/storage.types";

export interface IStorageService {
  save(file: SaveFileInput): Promise<StoredFile>;
  getPublicUrl(path: string): Promise<string>;
}
