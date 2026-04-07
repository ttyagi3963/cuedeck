import type { CreateEpisodeInput, Episode } from "@/contracts/episode";
import { createEpisodeSchema } from "@/contracts/episode";
import { NotFoundError } from "@/contracts/errors";
import type { IEpisodeService } from "./IEpisodeService";
import type { IEpisodeRepository } from "@/repositories/episode/IEpisodeRepository";

export class EpisodeServiceImpl implements IEpisodeService {
  constructor(private readonly episodeRepository: IEpisodeRepository) {}

  async findAll(): Promise<Episode[]> {
    return this.episodeRepository.findAll();
  }

  async findById(id: string): Promise<Episode | null> {
    return this.episodeRepository.findById(id);
  }

  async create(input: CreateEpisodeInput): Promise<Episode> {
    const episodeInput = createEpisodeSchema.parse(input);
    return this.episodeRepository.create(episodeInput);
  }

  async delete(id: string): Promise<void> {
    const episode = await this.episodeRepository.findById(id);
    if (!episode) {
      throw new NotFoundError("Episode");
    }
    await this.episodeRepository.delete(id);
  }
}
