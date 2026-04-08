import type {
  CreateTranscriptSegmentInput,
  TranscriptSegment,
} from "@/contracts/transcript";

export interface ITranscriptService {
  findByEpisodeId(episodeId: string): Promise<TranscriptSegment[]>;
  replaceForEpisode(
    episodeId: string,
    segments: CreateTranscriptSegmentInput[],
  ): Promise<TranscriptSegment[]>;
}
