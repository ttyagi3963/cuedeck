import type { StartTranscriptionResult } from "@/contracts/transcript";

export interface ITranscriptionService {
  start(episodeId: string): Promise<StartTranscriptionResult>;
}
