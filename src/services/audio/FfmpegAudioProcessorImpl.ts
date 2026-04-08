import type { PreparedAudioFile } from "@/lib/pipeline/extractTranscriptAudio";
import {
  extractTranscriptAudio,
  probeTranscriptAudioSource,
  type TranscriptAudioSourceProbe,
} from "@/lib/pipeline/extractTranscriptAudio";
import type { IStorageService } from "@/services/storage/IStorageService";
import type { IAudioProcessor } from "./IAudioProcessor";

export class FfmpegAudioProcessorImpl implements IAudioProcessor {
  async probeTranscriptSource(
    sourceUrl: string,
    storageService: IStorageService,
  ): Promise<TranscriptAudioSourceProbe> {
    return probeTranscriptAudioSource(sourceUrl, storageService);
  }

  async prepareTranscriptAudio(
    sourceUrl: string,
    storageService: IStorageService,
  ): Promise<PreparedAudioFile> {
    return extractTranscriptAudio(sourceUrl, storageService);
  }
}
