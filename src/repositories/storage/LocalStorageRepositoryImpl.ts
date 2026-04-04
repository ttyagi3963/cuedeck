// src/repositories/storage/LocalStorageRepositoryImpl.ts

import fs from "node:fs/promises";
import path from "node:path";

import type { IStorageRepository } from "./IStorageRepository";
import type {
  SaveFileInput,
  StoredFile,
} from "@/contracts/storage/storage.types";

export class LocalStorageRepositoryImpl implements IStorageRepository {
  private readonly videosRoot = path.join(process.cwd(), "public", "videos");

  async save(file: SaveFileInput): Promise<StoredFile> {
    const folderPath = path.join(this.videosRoot, file.bucket);
    const fullFilePath = path.join(folderPath, file.fileName);

    await fs.mkdir(folderPath, { recursive: true });
    await fs.writeFile(fullFilePath, file.buffer);

    return {
      path: `${file.bucket}/${file.fileName}`,
      url: `/videos/${file.bucket}/${file.fileName}`,
      size: file.buffer.length,
      contentType: file.contentType,
    };
  }

  async getPublicUrl(filePath: string): Promise<string> {
    return `/videos/${filePath}`;
  }
}
