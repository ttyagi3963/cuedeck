import { prisma } from "@/lib/prisma";
import type { Episode } from "@/contracts/episode";
import type { IEpisodeRepository } from "./IEpisodeRepository";

export class PrismaEpisodeRepositoryImpl implements IEpisodeRepository {
  async findById(id: string): Promise<Episode | null> {
    return prisma.episode.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<Episode[]> {
    return prisma.episode.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}
