import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type {
  CreateJobInput,
  Job,
  JobType,
  UpdateJobInput,
} from "@/contracts/job";
import type { IJobRepository } from "./IJobRepository";
import { toJob } from "./jobMappers";
import type { Job as PrismaJob } from "@/generated/prisma/client";

function toPrismaJson(
  value:
    | CreateJobInput["payload"]
    | UpdateJobInput["payload"]
    | CreateJobInput["result"]
    | UpdateJobInput["result"]
    | undefined,
) {
  if (value === undefined) {
    return undefined;
  }

  return value === null
    ? Prisma.JsonNull
    : (value as Prisma.InputJsonValue);
}

export class PrismaJobRepositoryImpl implements IJobRepository {
  async findById(id: string): Promise<Job | null> {
    const row = await prisma.job.findUnique({
      where: { id },
    });
    return row ? toJob(row) : null;
  }

  async findLatestByEpisodeIdAndType(
    episodeId: string,
    type: JobType,
  ): Promise<Job | null> {
    const row = await prisma.job.findFirst({
      where: { episodeId, type },
      orderBy: { createdAt: "desc" },
    });

    return row ? toJob(row) : null;
  }

  async create(input: CreateJobInput): Promise<Job> {
    const row = await prisma.job.create({
      data: {
        type: input.type,
        episodeId: input.episodeId,
        status: input.status,
        progress: input.progress,
        error: input.error,
        payload: toPrismaJson(input.payload),
        result: toPrismaJson(input.result),
        retryCount: input.retryCount,
        maxRetries: input.maxRetries,
        startedAt: input.startedAt,
        completedAt: input.completedAt,
      },
    });

    return toJob(row);
  }

  async update(id: string, input: UpdateJobInput): Promise<Job> {
    const row = await prisma.job.update({
      where: { id },
      data: {
        ...input,
        payload: toPrismaJson(input.payload),
        result: toPrismaJson(input.result),
      },
    });

    return toJob(row);
  }

  async claimNextRunnable(staleBefore: Date): Promise<Job | null> {
    const rows = await prisma.$queryRaw<PrismaJob[]>`
      WITH candidate AS (
        SELECT id
        FROM "Job"
        WHERE
          status = 'QUEUED'::"JobStatus"
          OR (
            status = 'PROCESSING'::"JobStatus"
            AND "completedAt" IS NULL
            AND "updatedAt" < ${staleBefore}
            AND "retryCount" < "maxRetries"
          )
        ORDER BY
          CASE WHEN status = 'PROCESSING'::"JobStatus" THEN 0 ELSE 1 END,
          "createdAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE "Job" AS job
      SET
        status = 'PROCESSING'::"JobStatus",
        error = NULL,
        result = NULL,
        "completedAt" = NULL,
        "startedAt" = COALESCE(job."startedAt", NOW()),
        "retryCount" = CASE
          WHEN job.status = 'PROCESSING'::"JobStatus" THEN job."retryCount" + 1
          ELSE job."retryCount"
        END,
        "updatedAt" = NOW()
      FROM candidate
      WHERE job.id = candidate.id
      RETURNING job.*;
    `;

    return rows[0] ? toJob(rows[0]) : null;
  }

  async failStaleProcessingJobs(staleBefore: Date): Promise<number> {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE "Job"
      SET
        status = 'FAILED'::"JobStatus",
        error = COALESCE(
          error,
          'Job timed out and exceeded its retry limit'
        ),
        "completedAt" = NOW(),
        "updatedAt" = NOW()
      WHERE
        status = 'PROCESSING'::"JobStatus"
        AND "completedAt" IS NULL
        AND "updatedAt" < ${staleBefore}
        AND "retryCount" >= "maxRetries"
      RETURNING id;
    `;

    return rows.length;
  }

  async heartbeat(id: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE "Job"
      SET "updatedAt" = NOW()
      WHERE id = ${id}
        AND status = 'PROCESSING'::"JobStatus";
    `;
  }
}
