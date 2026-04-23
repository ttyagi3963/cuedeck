import { generatePeaks } from "@/lib/audio/peaks";
import type {
  GeneratePeaksOptions,
  IAudioPeaksProcessor,
  PeaksResult,
} from "./IAudioPeaksProcessor";

export class FfmpegAudioPeaksProcessorImpl implements IAudioPeaksProcessor {
  async generatePeaks(
    inputPath: string,
    options?: GeneratePeaksOptions,
  ): Promise<PeaksResult> {
    return generatePeaks(inputPath, options);
  }
}
