import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { CreateJobInput, Job, UpdateJobInput } from "@/contracts/job";
import type { IJobRepository } from "./IJobRepository";
import { toJob } from "./jobMappers";

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
}
