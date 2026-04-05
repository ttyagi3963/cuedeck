import { prisma } from "@/lib/prisma";
import type { Marker, MarkerType } from "@/contracts/marker";
import type { IMarkerRepository } from "./IMarkerRepository";

export class PrismaMarkerRepositoryImpl implements IMarkerRepository {
  async findByEpisodeId(episodeId: string): Promise<Marker[]> {
    return prisma.marker.findMany({
      where: { episodeId },
      orderBy: { timeSec: "asc" },
    });
  }

  async findById(id: string): Promise<Marker | null> {
    return prisma.marker.findUnique({
      where: { id },
    });
  }

  async create(
    episodeId: string,
    timeSec: number,
    type: MarkerType,
  ): Promise<Marker> {
    return prisma.marker.create({
      data: { episodeId, timeSec, type },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.marker.delete({
      where: { id },
    });
  }
}
