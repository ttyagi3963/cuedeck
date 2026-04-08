import type {
  CreateTranscriptSegmentInput,
  TranscriptSegment,
} from "@/contracts/transcript";
import { createTranscriptSegmentSchema } from "@/contracts/transcript";
import type { ITranscriptService } from "./ITranscriptService";
import type { ITranscriptRepository } from "@/repositories/transcript/ITranscriptRepository";

export class TranscriptServiceImpl implements ITranscriptService {
  constructor(private readonly transcriptRepository: ITranscriptRepository) {}

  async findByEpisodeId(episodeId: string): Promise<TranscriptSegment[]> {
    return this.transcriptRepository.findByEpisodeId(episodeId);
  }

  async replaceForEpisode(
    episodeId: string,
    segments: CreateTranscriptSegmentInput[],
  ): Promise<TranscriptSegment[]> {
    const parsedSegments = segments.map((segment) =>
      createTranscriptSegmentSchema.parse(segment),
    );

    return this.transcriptRepository.replaceForEpisode(episodeId, parsedSegments);
  }
}
