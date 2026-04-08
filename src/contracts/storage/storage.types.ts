export type { StorageBucket } from "./storage.constants";
import type { StorageBucket } from "./storage.constants";

export interface StoredFile {
  path: string;
  url: string;
  size: number;
  contentType: string;
}

export interface SaveFileInput {
  bucket: StorageBucket;
  fileName: string;
  contentType: string;
  buffer: Buffer;
}

export interface CreateUploadTargetInput {
  bucket: StorageBucket;
  fileName: string;
  contentType: string;
  contentLength: number;
}

export interface UploadTarget {
  path: string;
  method: "PUT";
  url: string;
  headers: Record<string, string>;
  expiresAt: string;
}
