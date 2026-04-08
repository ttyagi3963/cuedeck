import type { GenerationPlan, GenerateFinalVideoResult, HlsPackageResult } from "@/contracts/generation";
import type { StoredFile } from "@/contracts/storage";
import type { IStorageService } from "@/services/storage/IStorageService";

export interface IVideoProcessor {
  generateFinalVideo(
    plan: GenerationPlan,
    storageService: IStorageService,
  ): Promise<GenerateFinalVideoResult>;

  generateHlsStream(
    episodeId: string,
    sourceFile: StoredFile,
    storageService: IStorageService,
  ): Promise<HlsPackageResult>;
}
