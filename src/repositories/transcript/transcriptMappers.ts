import type { TranscriptSegment as TranscriptSegmentRow } from "@/generated/prisma/client";
import type { TranscriptSegment } from "@/contracts/transcript";

export function toTranscriptSegment(
  row: TranscriptSegmentRow,
): TranscriptSegment {
  return {
    id: row.id,
    episodeId: row.episodeId,
    startTime: row.startTime,
    endTime: row.endTime,
    text: row.text,
    confidence: row.confidence,
  };
}
