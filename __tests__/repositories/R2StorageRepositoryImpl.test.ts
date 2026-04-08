import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { STORAGE_BUCKETS } from "@/contracts/storage";
import { R2StorageRepositoryImpl } from "@/repositories/storage/R2StorageRepositoryImpl";

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}));

type MockSend = ReturnType<typeof vi.fn>;

function createMockClient(sendMock: MockSend): S3Client {
  return {
    send: sendMock,
  } as unknown as S3Client;
}

function createRepository(
  client: S3Client,
  overrides: Partial<ConstructorParameters<typeof R2StorageRepositoryImpl>[0]> = {},
) {
  return new R2StorageRepositoryImpl({
    accountId: "account-123",
    accessKeyId: "access-key",
    secretAccessKey: "secret-key",
    privateBucketName: "cuedeck-private",
    publicBucketName: "cuedeck-public",
    publicBuckets: STORAGE_BUCKETS.filter((bucket) => bucket === "generated"),
    publicBaseUrl: "https://pub.example.r2.dev",
    downloadRootDirectory: path.join(os.tmpdir(), "cuedeck-r2-tests"),
    client: client as S3Client,
    ...overrides,
  });
}

describe("R2StorageRepositoryImpl", () => {
  let client: S3Client;
  let sendMock: MockSend;
  let downloadRootDirectory: string;

  beforeEach(() => {
    sendMock = vi.fn();
    client = createMockClient(sendMock);
    downloadRootDirectory = path.join(
      os.tmpdir(),
      "cuedeck-r2-tests",
      `run-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    vi.mocked(getSignedUrl).mockReset();
  });

  afterEach(async () => {
    await fs.rm(downloadRootDirectory, { recursive: true, force: true });
  });

  it("uploads private media and returns a stable internal object URL", async () => {
    sendMock.mockResolvedValue({});

    const repository = createRepository(client, { downloadRootDirectory });
    const result = await repository.save({
      bucket: "episodes",
      fileName: "episode-1.mp4",
      contentType: "video/mp4",
      buffer: Buffer.from("video-bytes"),
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0]?.[0]).toBeInstanceOf(PutObjectCommand);
    expect((sendMock.mock.calls[0]?.[0] as PutObjectCommand).input).toMatchObject({
      Bucket: "cuedeck-private",
      Key: "episodes/episode-1.mp4",
      ContentType: "video/mp4",
      Body: Buffer.from("video-bytes"),
    });
    expect(result).toEqual({
      path: "episodes/episode-1.mp4",
      url: "r2://cuedeck-private/episodes/episode-1.mp4",
      size: "video-bytes".length,
      contentType: "video/mp4",
    });
  });

  it("uploads generated assets to the public bucket and returns a public URL", async () => {
    sendMock.mockResolvedValue({});

    const repository = createRepository(client, { downloadRootDirectory });
    const result = await repository.save({
      bucket: "generated",
      fileName: "episode-1/hls/master.m3u8",
      contentType: "application/vnd.apple.mpegurl",
      buffer: Buffer.from("#EXTM3U"),
    });

    expect((sendMock.mock.calls[0]?.[0] as PutObjectCommand).input).toMatchObject({
      Bucket: "cuedeck-public",
      Key: "generated/episode-1/hls/master.m3u8",
    });
    expect(result.url).toBe(
      "https://pub.example.r2.dev/generated/episode-1/hls/master.m3u8",
    );
  });

  it("generates a signed URL for private media paths", async () => {
    vi.mocked(getSignedUrl).mockResolvedValue("https://signed.example.com/object");

    const repository = createRepository(client, { downloadRootDirectory });
    const result = await repository.getPublicUrl("episodes/episode-1.mp4");

    expect(result).toBe("https://signed.example.com/object");
    expect(vi.mocked(getSignedUrl)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(getSignedUrl).mock.calls[0]?.[0]).toBe(client);
    expect(vi.mocked(getSignedUrl).mock.calls[0]?.[1]).toBeInstanceOf(GetObjectCommand);
    expect((vi.mocked(getSignedUrl).mock.calls[0]?.[1] as GetObjectCommand).input).toMatchObject({
      Bucket: "cuedeck-private",
      Key: "episodes/episode-1.mp4",
    });
    expect(vi.mocked(getSignedUrl).mock.calls[0]?.[2]).toEqual({ expiresIn: 3600 });
  });

  it("creates a signed upload target for private media", async () => {
    vi.mocked(getSignedUrl).mockResolvedValue("https://signed.example.com/upload");

    const repository = createRepository(client, { downloadRootDirectory });
    const result = await repository.createUploadTarget({
      bucket: "episodes",
      fileName: "episode-1.mp4",
      contentType: "video/mp4",
      contentLength: 1234,
    });

    expect(result.path).toBe("episodes/episode-1.mp4");
    expect(result.method).toBe("PUT");
    expect(result.url).toBe("https://signed.example.com/upload");
    expect(result.headers).toEqual({ "Content-Type": "video/mp4" });
    expect(vi.mocked(getSignedUrl).mock.calls[0]?.[1]).toBeInstanceOf(PutObjectCommand);
    expect((vi.mocked(getSignedUrl).mock.calls[0]?.[1] as PutObjectCommand).input).toMatchObject({
      Bucket: "cuedeck-private",
      Key: "episodes/episode-1.mp4",
      ContentType: "video/mp4",
    });
  });

  it("returns false when a requested object does not exist", async () => {
    sendMock.mockRejectedValue({ name: "NotFound" });

    const repository = createRepository(client, { downloadRootDirectory });
    const result = await repository.exists("episodes/missing.mp4");

    expect(result).toBe(false);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0]?.[0]).toBeInstanceOf(HeadObjectCommand);
    expect((sendMock.mock.calls[0]?.[0] as HeadObjectCommand).input).toMatchObject({
      Bucket: "cuedeck-private",
      Key: "episodes/missing.mp4",
    });
  });

  it("downloads an object once and reuses the cached local copy", async () => {
    const transformToByteArray = vi
      .fn()
      .mockResolvedValue(Uint8Array.from([1, 2, 3, 4]));
    sendMock.mockResolvedValue({
      Body: {
        transformToByteArray,
      },
    });

    const repository = createRepository(client, { downloadRootDirectory });
    const objectUrl = "r2://cuedeck-private/episodes/episode-1.mp4";

    const firstPath = await repository.provideLocalCopy(objectUrl);
    const secondPath = await repository.provideLocalCopy(objectUrl);

    expect(firstPath).toBe(secondPath);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0]?.[0]).toBeInstanceOf(GetObjectCommand);
    expect((sendMock.mock.calls[0]?.[0] as GetObjectCommand).input).toMatchObject({
      Bucket: "cuedeck-private",
      Key: "episodes/episode-1.mp4",
    });
    expect(await fs.readFile(firstPath)).toEqual(Buffer.from([1, 2, 3, 4]));
  });

});
