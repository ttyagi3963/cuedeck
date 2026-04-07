import { prisma } from "@/lib/prisma";
import type { CreateEpisodeInput, Episode } from "@/contracts/episode";
import type { IEpisodeRepository } from "./IEpisodeRepository";
import { toEpisode } from "./episodeMappers";

export class PrismaEpisodeRepositoryImpl implements IEpisodeRepository {
  async findById(id: string): Promise<Episode | null> {
    const row = await prisma.episode.findUnique({
      where: { id },
    });
    return row ? toEpisode(row) : null;
  }

  async findAll(): Promise<Episode[]> {
    const rows = await prisma.episode.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toEpisode);
  }

  async create(input: CreateEpisodeInput): Promise<Episode> {
    const { title, sourceUrl, duration } = input;

    const row = await prisma.episode.create({
      data: {
        title,
        sourceUrl,
        duration,
      },
    });
    return toEpisode(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.episode.delete({
      where: { id },
    });
  }
}
