import { prisma } from "@/lib/prisma";
import type { CreateEpisodeInput, Episode } from "@/contracts/episode";
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

  async create(input: CreateEpisodeInput): Promise<Episode> {
    const { title, sourceUrl, duration } = input;

    return prisma.episode.create({
      data: {
        title,
        sourceUrl,
        duration,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.episode.delete({
      where: { id },
    });
  }
}
