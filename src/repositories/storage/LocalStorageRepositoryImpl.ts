// src/repositories/storage/LocalStorageRepositoryImpl.ts

import fs from "node:fs/promises";
import path from "node:path";

import type { IStorageRepository } from "./IStorageRepository";
import type {
  CreateUploadTargetInput,
  SaveFileInput,
  StoredFile,
  UploadTarget,
} from "@/contracts/storage/storage.types";
import {
  buildLocalStoragePublicUrl,
  getLocalStorageAbsolutePath,
  getLocalStoragePathFromPublicUrl,
} from "@/lib/storage/localStoragePaths";
import { InfrastructureError } from "@/lib/errors/InfrastructureError";
import { normalizeStoredPath } from "@/utils/paths";

const UPLOAD_TARGET_TTL_SEC = 60 * 60;

function resolveStoredPath(filePathOrUrl: string): string {
  const storedPath = getLocalStoragePathFromPublicUrl(filePathOrUrl);
  if (storedPath) {
    return normalizeStoredPath(storedPath);
  }

  try {
    const parsedUrl = new URL(filePathOrUrl);
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      throw new InfrastructureError(
        `Unsupported local media source: ${filePathOrUrl}`,
        "UNSUPPORTED_MEDIA_SOURCE",
      );
    }
  } catch (error) {
    if (error instanceof InfrastructureError) {
      throw error;
    }
  }

  return normalizeStoredPath(filePathOrUrl);
}

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

  async createUploadTarget(file: CreateUploadTargetInput): Promise<UploadTarget> {
    const storedPath = normalizeStoredPath(`${file.bucket}/${file.fileName}`);

    return {
      path: storedPath,
      method: "PUT",
      url: `/api/uploads/local?path=${encodeURIComponent(storedPath)}`,
      headers: {
        "Content-Type": file.contentType,
      },
      expiresAt: new Date(
        Date.now() + UPLOAD_TARGET_TTL_SEC * 1000,
      ).toISOString(),
    };
  }

  async getPublicUrl(filePath: string): Promise<string> {
    return buildLocalStoragePublicUrl(resolveStoredPath(filePath));
  }

  async exists(filePath: string): Promise<boolean> {
    const fullFilePath = getLocalStorageAbsolutePath(resolveStoredPath(filePath));

    try {
      await fs.access(fullFilePath);
      return true;
    } catch {
      return false;
    }
  }

  async delete(filePath: string): Promise<void> {
    const fullFilePath = getLocalStorageAbsolutePath(resolveStoredPath(filePath));

    try {
      await fs.unlink(fullFilePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  async provideLocalCopy(url: string): Promise<string> {
    const fullFilePath = getLocalStorageAbsolutePath(resolveStoredPath(url));

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
