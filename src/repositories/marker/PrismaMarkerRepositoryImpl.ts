import { prisma } from "@/lib/prisma";
import type { MarkerAd as ContractMarkerAd } from "@/contracts/ad";
import type { Marker, MarkerType } from "@/contracts/marker";
import type {
  Ad as PrismaAd,
  Marker as PrismaMarker,
  MarkerAd as PrismaMarkerAd,
} from "@/generated/prisma/client";
import { toAd } from "@/repositories/ad/adMappers";
import type { IMarkerRepository } from "./IMarkerRepository";

const MARKER_INCLUDE = { ads: { include: { ad: true } } } as const;

type MarkerAdRow = PrismaMarkerAd & { ad: PrismaAd };
type MarkerRow = PrismaMarker & { ads: MarkerAdRow[] };

function toMarkerAd(row: MarkerAdRow): ContractMarkerAd {
  return {
    id: row.id,
    markerId: row.markerId,
    adId: row.adId,
    playCount: row.playCount,
    ad: toAd(row.ad),
  };
}

function toMarker(row: MarkerRow): Marker {
  return {
    id: row.id,
    episodeId: row.episodeId,
    timeSec: row.timeSec,
    type: row.type,
    label: row.label,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    markerAds: row.ads.map(toMarkerAd),
  };
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
    adIds: string[] = [],
  ): Promise<Marker> {
    if (adIds.length === 0) {
      const row = await prisma.marker.create({
        data: { episodeId, timeSec, type },
        include: MARKER_INCLUDE,
      });
      return toMarker(row);
    }

    return prisma.$transaction(async (tx) => {
      const marker = await tx.marker.create({
        data: { episodeId, timeSec, type },
      });

      await tx.markerAd.createMany({
        data: adIds.map((adId) => ({
          markerId: marker.id,
          adId,
        })),
      });

      const row = await tx.marker.findUniqueOrThrow({
        where: { id: marker.id },
        include: MARKER_INCLUDE,
      });
      return toMarker(row);
    });
  }

  async update(id: string, timeSec: number, adIds?: string[]): Promise<Marker> {
    if (adIds === undefined) {
      const row = await prisma.marker.update({
        where: { id },
        data: { timeSec },
        include: MARKER_INCLUDE,
      });
      return toMarker(row);
    }

    return prisma.$transaction(async (tx) => {
      await tx.marker.update({
        where: { id },
        data: { timeSec },
      });

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
