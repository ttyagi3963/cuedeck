import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { IStorageRepository } from "./IStorageRepository";
import type {
  CreateUploadTargetInput,
  SaveFileInput,
  StorageBucket,
  StoredFile,
  UploadTarget,
} from "@/contracts/storage/storage.types";
import { isStorageBucket } from "@/contracts/storage";
import { InfrastructureError } from "@/lib/errors/InfrastructureError";
import { normalizeStoredPath } from "@/utils/paths";

const R2_INTERNAL_PROTOCOL = "r2:";
const SIGNED_URL_TTL_SEC = 60 * 60;

export type R2StorageRepositoryOptions = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  privateBucketName: string;
  publicBucketName: string;
  publicBuckets: readonly StorageBucket[];
  publicBaseUrl: string;
  endpoint?: string;
  downloadRootDirectory?: string;
  signedUrlTtlSec?: number;
  client?: S3Client;
};

type ObjectLocation = {
  bucketName: string;
  key: string;
  isPublic: boolean;
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function toObjectKey(bucket: StorageBucket, fileName: string): string {
  return normalizeStoredPath(`${bucket}/${fileName}`);
}

function toByteArrayBody(body: unknown): { transformToByteArray: () => Promise<Uint8Array> } {
  if (
    body &&
    typeof body === "object" &&
    "transformToByteArray" in body &&
    typeof body.transformToByteArray === "function"
  ) {
    return body as { transformToByteArray: () => Promise<Uint8Array> };
  }

  throw new InfrastructureError(
    "R2 returned an unreadable object body.",
    "R2_UNREADABLE_OBJECT_BODY",
  );
}

export class R2StorageRepositoryImpl implements IStorageRepository {
  private readonly client: S3Client;
  private readonly accountId: string;
  private readonly endpoint: string;
  private readonly endpointHost: string;
  private readonly privateBucketName: string;
  private readonly publicBucketName: string;
  private readonly publicBuckets: ReadonlySet<StorageBucket>;
  private readonly publicBaseUrl: string;
  private readonly downloadRootDirectory: string;
  private readonly signedUrlTtlSec: number;

  constructor(options: R2StorageRepositoryOptions) {
    this.accountId = options.accountId;
    this.endpoint = this.normalizeEndpoint(
      options.endpoint ?? `https://${options.accountId}.r2.cloudflarestorage.com`,
    );
    this.endpointHost = new URL(this.endpoint).host;
    this.privateBucketName = options.privateBucketName;
    this.publicBucketName = options.publicBucketName;
    this.publicBuckets = new Set(options.publicBuckets);
    this.publicBaseUrl = trimTrailingSlash(options.publicBaseUrl);
    this.downloadRootDirectory =
      options.downloadRootDirectory ?? path.join(os.tmpdir(), "cuedeck-r2-cache");
    this.signedUrlTtlSec = options.signedUrlTtlSec ?? SIGNED_URL_TTL_SEC;

    this.client =
      options.client ??
      new S3Client({
        region: "auto",
        endpoint: this.endpoint,
        credentials: {
          accessKeyId: options.accessKeyId,
          secretAccessKey: options.secretAccessKey,
        },
      });
  }

  async save(file: SaveFileInput): Promise<StoredFile> {
    const location = this.buildLocationForBucket(file.bucket, file.fileName);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: location.bucketName,
          Key: location.key,
          Body: file.buffer,
          ContentType: file.contentType,
        }),
      );
    } catch {
      throw new InfrastructureError(
        `Failed to upload media file to R2: ${location.key}`,
        "R2_UPLOAD_FAILED",
      );
    }

    return {
      path: location.key,
      url: location.isPublic
        ? this.buildPublicObjectUrl(location.key)
        : this.buildInternalObjectUrl(location),
      size: file.buffer.length,
      contentType: file.contentType,
    };
  }

  async createUploadTarget(file: CreateUploadTargetInput): Promise<UploadTarget> {
    const location = this.buildLocationForBucket(file.bucket, file.fileName);

    try {
      return {
        path: location.key,
        method: "PUT",
        url: await getSignedUrl(
          this.client,
          new PutObjectCommand({
            Bucket: location.bucketName,
            Key: location.key,
            ContentType: file.contentType,
          }),
          { expiresIn: this.signedUrlTtlSec },
        ),
        headers: {
          "Content-Type": file.contentType,
        },
        expiresAt: new Date(
          Date.now() + this.signedUrlTtlSec * 1000,
        ).toISOString(),
      };
    } catch {
      throw new InfrastructureError(
        `Failed to create an upload target for ${location.key}`,
        "R2_UPLOAD_TARGET_FAILED",
      );
    }
  }

  async getPublicUrl(filePath: string): Promise<string> {
    const location = this.resolveObjectLocation(filePath);

    if (location.isPublic) {
      return this.buildPublicObjectUrl(location.key);
    }

    try {
      return await getSignedUrl(
        this.client,
        new GetObjectCommand({
          Bucket: location.bucketName,
          Key: location.key,
        }),
        { expiresIn: this.signedUrlTtlSec },
      );
    } catch {
      throw new InfrastructureError(
        `Failed to generate a signed URL for ${location.key}`,
        "R2_SIGNED_URL_FAILED",
      );
    }
  }

  async exists(filePath: string): Promise<boolean> {
    const location = this.resolveObjectLocation(filePath);

    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: location.bucketName,
          Key: location.key,
        }),
      );

      return true;
    } catch (error) {
      const errorName = (error as { name?: string }).name;

      if (errorName === "NoSuchKey" || errorName === "NotFound") {
        return false;
      }

      throw new InfrastructureError(
        `Failed to check whether media exists in R2: ${location.key}`,
        "R2_EXISTS_CHECK_FAILED",
      );
    }
  }

  async delete(filePath: string): Promise<void> {
    const location = this.resolveObjectLocation(filePath);

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: location.bucketName,
          Key: location.key,
        }),
      );
    } catch {
      throw new InfrastructureError(
        `Failed to delete media file from R2: ${location.key}`,
        "R2_DELETE_FAILED",
      );
    }

    await fs.rm(this.getDownloadPath(location), { force: true }).catch(() => undefined);
  }

  async provideLocalCopy(filePathOrUrl: string): Promise<string> {
    const location = this.resolveObjectLocation(filePathOrUrl);
    const localPath = this.getDownloadPath(location);

    try {
      await fs.access(localPath);
      return localPath;
    } catch {
      // Download on cache miss.
    }

    let responseBody: Uint8Array;

    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: location.bucketName,
          Key: location.key,
        }),
      );

      responseBody = await toByteArrayBody(response.Body).transformToByteArray();
    } catch (error) {
      const errorName = (error as { name?: string }).name;

      if (errorName === "NoSuchKey" || errorName === "NotFound") {
        throw new InfrastructureError(
          `Media file does not exist in R2: ${location.key}`,
          "MEDIA_FILE_NOT_FOUND",
        );
      }

      if (error instanceof InfrastructureError) {
        throw error;
      }

      throw new InfrastructureError(
        `Failed to download media file from R2: ${location.key}`,
        "R2_DOWNLOAD_FAILED",
      );
    }

    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, Buffer.from(responseBody));

    return localPath;
  }

  private normalizeEndpoint(endpoint: string): string {
    try {
      return new URL(endpoint).origin;
    } catch {
      throw new InfrastructureError(
        `Invalid R2 endpoint: ${endpoint}`,
        "R2_INVALID_ENDPOINT",
      );
    }
  }

  private buildLocationForBucket(
    bucket: StorageBucket,
    fileName: string,
  ): ObjectLocation {
    return {
      bucketName: this.getPhysicalBucketName(bucket),
      key: toObjectKey(bucket, fileName),
      isPublic: this.publicBuckets.has(bucket),
    };
  }

  private getPhysicalBucketName(bucket: StorageBucket): string {
    return this.publicBuckets.has(bucket)
      ? this.publicBucketName
      : this.privateBucketName;
  }

  private buildInternalObjectUrl(location: ObjectLocation): string {
    return `${R2_INTERNAL_PROTOCOL}//${location.bucketName}/${location.key}`;
  }

  private buildPublicObjectUrl(key: string): string {
    return `${this.publicBaseUrl}/${normalizeStoredPath(key)}`;
  }

  private resolveObjectLocation(filePathOrUrl: string): ObjectLocation {
    const fromUrl = this.tryResolveFromUrl(filePathOrUrl);
    if (fromUrl) {
      return fromUrl;
    }

    const key = normalizeStoredPath(filePathOrUrl);
    const logicalBucket = this.getLogicalBucketFromKey(key);

    return {
      bucketName: this.getPhysicalBucketName(logicalBucket),
      key,
      isPublic: this.publicBuckets.has(logicalBucket),
    };
  }

  private tryResolveFromUrl(filePathOrUrl: string): ObjectLocation | null {
    if (filePathOrUrl.startsWith(`${this.publicBaseUrl}/`)) {
      const key = normalizeStoredPath(
        filePathOrUrl.slice(this.publicBaseUrl.length + 1),
      );

      return {
        bucketName: this.publicBucketName,
        key,
        isPublic: true,
      };
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(filePathOrUrl);
    } catch {
      return null;
    }

    if (parsedUrl.protocol === R2_INTERNAL_PROTOCOL) {
      const bucketName = parsedUrl.host;
      const key = normalizeStoredPath(parsedUrl.pathname);

      if (!bucketName || !key) {
        throw new InfrastructureError(
          `Invalid internal R2 object URL: ${filePathOrUrl}`,
          "R2_INVALID_OBJECT_URL",
        );
      }

      return {
        bucketName,
        key,
        isPublic: bucketName === this.publicBucketName,
      };
    }

    const virtualHostSuffix = `.${this.accountId}.r2.cloudflarestorage.com`;
    if (parsedUrl.host.endsWith(virtualHostSuffix)) {
      const bucketName = parsedUrl.host.slice(0, -virtualHostSuffix.length);
      const key = normalizeStoredPath(parsedUrl.pathname);

      if (!bucketName || !key) {
        throw new InfrastructureError(
          `Invalid R2 object URL: ${filePathOrUrl}`,
          "R2_INVALID_OBJECT_URL",
        );
      }

      return {
        bucketName,
        key,
        isPublic: bucketName === this.publicBucketName,
      };
    }

    if (parsedUrl.host === this.endpointHost) {
      const pathSegments = normalizeStoredPath(parsedUrl.pathname).split("/");
      const [bucketName, ...keyParts] = pathSegments;
      const key = normalizeStoredPath(keyParts.join("/"));

      if (!bucketName || !key) {
        throw new InfrastructureError(
          `Invalid R2 object URL: ${filePathOrUrl}`,
          "R2_INVALID_OBJECT_URL",
        );
      }

      return {
        bucketName,
        key,
        isPublic: bucketName === this.publicBucketName,
      };
    }

    return null;
  }

  private getLogicalBucketFromKey(key: string): StorageBucket {
    const [bucket] = normalizeStoredPath(key).split("/");

    if (!bucket || !isStorageBucket(bucket)) {
      throw new InfrastructureError(
        `Unsupported storage path: ${key}`,
        "UNSUPPORTED_MEDIA_SOURCE",
      );
    }

    return bucket;
  }

  private getDownloadPath(location: ObjectLocation): string {
    return path.join(
      this.downloadRootDirectory,
      location.bucketName,
      ...normalizeStoredPath(location.key).split("/"),
    );
  }
}
