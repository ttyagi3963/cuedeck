import { prisma } from "@/lib/prisma";
import type { Marker, MarkerType } from "@/contracts/marker";
import type { IMarkerRepository } from "./IMarkerRepository";

const MARKER_INCLUDE = { ads: { include: { ad: true } } } as const;

function toMarker(row: { ads: unknown[] } & Record<string, unknown>): Marker {
  const { ads, ...rest } = row;
  return { ...rest, markerAds: ads } as unknown as Marker;
}

export class PrismaMarkerRepositoryImpl implements IMarkerRepository {
  async findByEpisodeId(episodeId: string): Promise<Marker[]> {
    const rows = await prisma.marker.findMany({
      where: { episodeId },
      orderBy: { timeSec: "asc" },
      include: MARKER_INCLUDE,
    });
    return rows.map(toMarker);
  }

  async findById(id: string): Promise<Marker | null> {
    const row = await prisma.marker.findUnique({
      where: { id },
      include: MARKER_INCLUDE,
    });
    return row ? toMarker(row) : null;
  }

  async create(
    episodeId: string,
    timeSec: number,
    type: MarkerType,
  ): Promise<Marker> {
    const row = await prisma.marker.create({
      data: { episodeId, timeSec, type },
      include: MARKER_INCLUDE,
    });
    return toMarker(row);
  }

  async createWithAds(
    episodeId: string,
    timeSec: number,
    type: MarkerType,
    adIds: string[],
  ): Promise<Marker> {
    return prisma.$transaction(async (tx) => {
      const marker = await tx.marker.create({
        data: { episodeId, timeSec, type },
      });

      if (adIds.length > 0) {
        await tx.markerAd.createMany({
          data: adIds.map((adId) => ({
            markerId: marker.id,
            adId,
          })),
        });
      }

      const row = await tx.marker.findUniqueOrThrow({
        where: { id: marker.id },
        include: MARKER_INCLUDE,
      });
      return toMarker(row);
    });
  }

  async update(id: string, timeSec: number): Promise<Marker> {
    const row = await prisma.marker.update({
      where: { id },
      data: { timeSec },
      include: MARKER_INCLUDE,
    });
    return toMarker(row);
  }

  async updateWithAds(
    id: string,
    timeSec: number,
    adIds: string[],
  ): Promise<Marker> {
    return prisma.$transaction(async (tx) => {
      await tx.marker.update({
        where: { id },
        data: { timeSec },
      });

      // Replace all ad assignments
      await tx.markerAd.deleteMany({ where: { markerId: id } });
      if (adIds.length > 0) {
        await tx.markerAd.createMany({
          data: adIds.map((adId) => ({ markerId: id, adId })),
        });
      }

      const row = await tx.marker.findUniqueOrThrow({
        where: { id },
        include: MARKER_INCLUDE,
      });
      return toMarker(row);
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.marker.delete({
      where: { id },
    });
  }
}
