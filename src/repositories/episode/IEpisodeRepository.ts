import type { Episode } from "@/contracts/episode";

export interface IEpisodeRepository {
  findById(id: string): Promise<Episode | null>;
  findAll(): Promise<Episode[]>;
}
