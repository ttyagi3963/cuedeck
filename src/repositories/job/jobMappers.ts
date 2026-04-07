import type { Job } from "@/contracts/job";
import type { Job as PrismaJob } from "@/generated/prisma/client";

export function toJob(row: PrismaJob): Job {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    episodeId: row.episodeId,
    progress: row.progress,
    error: row.error,
    payload: (row.payload ?? null) as Job["payload"],
    result: (row.result ?? null) as Job["result"],
    retryCount: row.retryCount,
    maxRetries: row.maxRetries,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
