import type {
  CreateJobInput,
  Job,
  JobType,
  UpdateJobInput,
} from "@/contracts/job";

export interface IJobService {
  findById(id: string): Promise<Job | null>;
  findLatestByEpisodeIdAndType(
    episodeId: string,
    type: JobType,
  ): Promise<Job | null>;
  create(input: CreateJobInput): Promise<Job>;
  update(id: string, input: UpdateJobInput): Promise<Job>;
  claimNextRunnable(staleBefore: Date): Promise<Job | null>;
  failStaleProcessingJobs(staleBefore: Date): Promise<number>;
  heartbeat(id: string): Promise<void>;
}
