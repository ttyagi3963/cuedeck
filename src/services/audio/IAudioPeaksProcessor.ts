import type { GeneratePeaksOptions, PeaksResult } from "@/lib/audio/peaks";

// Re-export so the implementation can import these types through the port
// rather than reaching into the infrastructure module directly.
export type { GeneratePeaksOptions, PeaksResult };

export interface IAudioPeaksProcessor {
  generatePeaks(
    inputPath: string,
    options?: GeneratePeaksOptions,
  ): Promise<PeaksResult>;
}
