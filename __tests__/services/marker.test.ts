import { describe, it, expect, vi, beforeEach } from "vitest";
import { MarkerServiceImpl } from "@/services/marker/MarkerServiceImpl";
import type { IMarkerRepository } from "@/repositories/marker/IMarkerRepository";
import type { Marker } from "@/contracts/marker";
import { NotFoundError } from "@/contracts/errors";

const STUB_MARKER: Marker = {
  id: "m1",
  episodeId: "ep1",
  timeSec: 30,
  type: "STATIC",
  label: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  markerAds: [],
};

function makeMockRepo(): IMarkerRepository {
  return {
    findByEpisodeId: vi.fn().mockResolvedValue([STUB_MARKER]),
    findById: vi.fn().mockResolvedValue(STUB_MARKER),
    create: vi.fn().mockResolvedValue(STUB_MARKER),
    update: vi.fn().mockResolvedValue(STUB_MARKER),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

describe("MarkerServiceImpl", () => {
  let repo: ReturnType<typeof makeMockRepo>;
  let service: MarkerServiceImpl;

  beforeEach(() => {
    repo = makeMockRepo();
    service = new MarkerServiceImpl(repo);
  });

  it("creates a marker with valid input", async () => {
    const result = await service.create("ep1", {
      timeSec: 30,
      type: "STATIC",
      adIds: [],
    });

    expect(repo.create).toHaveBeenCalledWith("ep1", 30, "STATIC", []);
    expect(result).toEqual(STUB_MARKER);
  });

  it("rejects create with negative timeSec", async () => {
    await expect(
      service.create("ep1", { timeSec: -5, type: "STATIC" }),
    ).rejects.toThrow();
  });

  it("rejects create with invalid type", async () => {
    await expect(
      service.create("ep1", { timeSec: 10, type: "INVALID" }),
    ).rejects.toThrow();
  });

  it("deletes an existing marker", async () => {
    await service.delete("m1");
    expect(repo.delete).toHaveBeenCalledWith("m1");
  });

  it("throws NotFoundError when deleting a missing marker", async () => {
    repo.findById = vi.fn().mockResolvedValue(null);
    await expect(service.delete("missing")).rejects.toThrow(NotFoundError);
  });

  it("updates an existing marker", async () => {
    await service.update("m1", { timeSec: 45 });
    expect(repo.update).toHaveBeenCalledWith("m1", 45, undefined);
  });

  it("throws NotFoundError when updating a missing marker", async () => {
    repo.findById = vi.fn().mockResolvedValue(null);
    await expect(service.update("missing", { timeSec: 10 })).rejects.toThrow(
      NotFoundError,
    );
  });

  it("rejects update with negative timeSec", async () => {
    await expect(service.update("m1", { timeSec: -1 })).rejects.toThrow();
  });
});
