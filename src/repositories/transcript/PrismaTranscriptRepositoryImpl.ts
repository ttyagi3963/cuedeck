import { prisma } from "@/lib/prisma";
import type {
  CreateTranscriptSegmentInput,
  TranscriptSegment,
} from "@/contracts/transcript";
import type { ITranscriptRepository } from "./ITranscriptRepository";
import { toTranscriptSegment } from "./transcriptMappers";

export class PrismaTranscriptRepositoryImpl implements ITranscriptRepository {
  async findByEpisodeId(episodeId: string): Promise<TranscriptSegment[]> {
    const rows = await prisma.transcriptSegment.findMany({
      where: { episodeId },
      orderBy: { startTime: "asc" },
    });

    return rows.map(toTranscriptSegment);
  }

  async replaceForEpisode(
    episodeId: string,
    segments: CreateTranscriptSegmentInput[],
  ): Promise<TranscriptSegment[]> {
    await prisma.$transaction(async (tx) => {
      await tx.transcriptSegment.deleteMany({
        where: { episodeId },
      });

      if (segments.length > 0) {
        await tx.transcriptSegment.createMany({
          data: segments.map((segment) => ({
            episodeId,
            startTime: segment.startTime,
            endTime: segment.endTime,
            text: segment.text,
            confidence: segment.confidence ?? 1,
          })),
        });
      }
    });

    return this.findByEpisodeId(episodeId);
  }
}
