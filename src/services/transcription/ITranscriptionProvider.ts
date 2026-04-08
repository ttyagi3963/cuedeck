import type {
  TranscriptJobPayload,
  TranscriptionResult,
} from "@/contracts/transcript";

export interface ITranscriptionProvider {
  transcribe(
    audioFilePath: string,
    payload: TranscriptJobPayload,
  ): Promise<TranscriptionResult>;
}
