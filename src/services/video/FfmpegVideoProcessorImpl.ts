import type { GenerationPlan, GenerateFinalVideoResult, HlsPackageResult } from "@/contracts/generation";
import type { StoredFile } from "@/contracts/storage";
import type { IStorageService } from "@/services/storage/IStorageService";
import { generateFinalVideo } from "@/lib/pipeline/generateFinalVideo";
import { generateHlsStream } from "@/lib/pipeline/generateHlsStream";
import type { IVideoProcessor } from "./IVideoProcessor";

export class FfmpegVideoProcessorImpl implements IVideoProcessor {
  async generateFinalVideo(
    plan: GenerationPlan,
    storageService: IStorageService,
  ): Promise<GenerateFinalVideoResult> {
    return generateFinalVideo(plan, storageService);
  }

  async generateHlsStream(
    episodeId: string,
    sourceFile: StoredFile,
    storageService: IStorageService,
  ): Promise<HlsPackageResult> {
    return generateHlsStream(episodeId, sourceFile, storageService);
  }
}
