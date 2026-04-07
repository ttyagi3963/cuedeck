import type { CreateEpisodeInput, Episode } from "@/contracts/episode";

export interface IEpisodeService {
  findAll(): Promise<Episode[]>;
  findById(id: string): Promise<Episode | null>;
  create(input: CreateEpisodeInput): Promise<Episode>;
  delete(id: string): Promise<void>;
}
