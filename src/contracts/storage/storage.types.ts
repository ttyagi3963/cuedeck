export type StorageBucket = "episodes" | "ads" | "generated";

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
