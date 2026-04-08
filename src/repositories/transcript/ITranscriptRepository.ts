import type {
  CreateTranscriptSegmentInput,
  TranscriptSegment,
} from "@/contracts/transcript";

export interface ITranscriptRepository {
  findByEpisodeId(episodeId: string): Promise<TranscriptSegment[]>;
  replaceForEpisode(
    episodeId: string,
    segments: CreateTranscriptSegmentInput[],
  ): Promise<TranscriptSegment[]>;
}
