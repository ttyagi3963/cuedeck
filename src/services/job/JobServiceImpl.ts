import type {
  CreateJobInput,
  Job,
  JobType,
  UpdateJobInput,
} from "@/contracts/job";
import { createJobSchema, updateJobSchema } from "@/contracts/job";
import type { IJobService } from "./IJobService";
import type { IJobRepository } from "@/repositories/job/IJobRepository";

export class JobServiceImpl implements IJobService {
  constructor(private readonly jobRepository: IJobRepository) {}

  async findById(id: string): Promise<Job | null> {
    return this.jobRepository.findById(id);
  }

  async findLatestByEpisodeIdAndType(
    episodeId: string,
    type: JobType,
  ): Promise<Job | null> {
    return this.jobRepository.findLatestByEpisodeIdAndType(episodeId, type);
  }

  async create(input: CreateJobInput): Promise<Job> {
    const jobInput = createJobSchema.parse(input);
    return this.jobRepository.create(jobInput);
  }

  async update(id: string, input: UpdateJobInput): Promise<Job> {
    const jobInput = updateJobSchema.parse(input);
    return this.jobRepository.update(id, jobInput);
  }

  async claimNextRunnable(staleBefore: Date): Promise<Job | null> {
    return this.jobRepository.claimNextRunnable(staleBefore);
  }

  async failStaleProcessingJobs(staleBefore: Date): Promise<number> {
    return this.jobRepository.failStaleProcessingJobs(staleBefore);
  }

  async heartbeat(id: string): Promise<void> {
    await this.jobRepository.heartbeat(id);
  }
}
