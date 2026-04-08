import type { IStorageService } from "@/services/storage/IStorageService";
import type {
  PreparedAudioFile,
  TranscriptAudioSourceProbe,
} from "@/lib/pipeline/extractTranscriptAudio";

export interface IAudioProcessor {
  probeTranscriptSource(
    sourceUrl: string,
    storageService: IStorageService,
  ): Promise<TranscriptAudioSourceProbe>;

  prepareTranscriptAudio(
    sourceUrl: string,
    storageService: IStorageService,
  ): Promise<PreparedAudioFile>;
}
