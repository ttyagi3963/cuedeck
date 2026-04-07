import type { StartGenerationResult } from "@/contracts/generation";

export interface IGenerationService {
  start(episodeId: string): Promise<StartGenerationResult>;
}
