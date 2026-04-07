import type { CreateEpisodeInput, Episode } from "@/contracts/episode";

export interface IEpisodeRepository {
  findById(id: string): Promise<Episode | null>;
  findAll(): Promise<Episode[]>;
  create(input: CreateEpisodeInput): Promise<Episode>;
  delete(id: string): Promise<void>;
}
