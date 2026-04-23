import type { Episode as ContractEpisode } from "@/contracts/episode";
import type { Episode as PrismaEpisode } from "@/generated/prisma/client";

export function toEpisode(row: PrismaEpisode): ContractEpisode {
  return {
    id: row.id,
    title: row.title,
    sourceUrl: row.sourceUrl,
    duration: row.duration,
    waveformUrl: row.waveformUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
