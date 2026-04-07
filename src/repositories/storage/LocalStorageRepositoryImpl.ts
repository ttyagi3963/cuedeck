// src/repositories/storage/LocalStorageRepositoryImpl.ts

import fs from "node:fs/promises";
import path from "node:path";

import type { IStorageRepository } from "./IStorageRepository";
import type {
  SaveFileInput,
  StoredFile,
} from "@/contracts/storage/storage.types";
import {
  buildLocalStoragePublicUrl,
  getLocalStorageAbsolutePath,
  getLocalStoragePathFromPublicUrl,
} from "@/lib/storage/localStoragePaths";
import { InfrastructureError } from "@/lib/errors/InfrastructureError";

export class LocalStorageRepositoryImpl implements IStorageRepository {
  async save(file: SaveFileInput): Promise<StoredFile> {
    const storedPath = `${file.bucket}/${file.fileName}`;
    const fullFilePath = getLocalStorageAbsolutePath(storedPath);
    const fullFileDirectory = path.dirname(fullFilePath);

    await fs.mkdir(fullFileDirectory, { recursive: true });
    await fs.writeFile(fullFilePath, file.buffer);

    return {
      path: storedPath,
      url: buildLocalStoragePublicUrl(storedPath),
      size: file.buffer.length,
      contentType: file.contentType,
    };
  }

  async getPublicUrl(filePath: string): Promise<string> {
    return buildLocalStoragePublicUrl(filePath);
  }

  async delete(filePath: string): Promise<void> {
    const fullFilePath = getLocalStorageAbsolutePath(filePath);

    try {
      await fs.unlink(fullFilePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  async provideLocalCopy(url: string): Promise<string> {
    const storedPath = getLocalStoragePathFromPublicUrl(url);
    if (!storedPath) {
      throw new InfrastructureError(
        `Unsupported local media source: ${url}`,
        "UNSUPPORTED_MEDIA_SOURCE",
      );
    }

    const fullFilePath = getLocalStorageAbsolutePath(storedPath);

    try {
      await fs.access(fullFilePath);
      return fullFilePath;
    } catch {
      throw new InfrastructureError(
        `Media file does not exist: ${fullFilePath}`,
        "MEDIA_FILE_NOT_FOUND",
      );
    }
  }
}
