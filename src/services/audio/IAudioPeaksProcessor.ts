import type { GeneratePeaksOptions, PeaksResult } from "@/lib/audio/peaks";

export interface IAudioPeaksProcessor {
  generatePeaks(
    inputPath: string,
    options?: GeneratePeaksOptions,
  ): Promise<PeaksResult>;
}
