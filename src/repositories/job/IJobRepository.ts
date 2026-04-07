import type { CreateJobInput, Job, UpdateJobInput } from "@/contracts/job";

export interface IJobRepository {
  findById(id: string): Promise<Job | null>;
  create(input: CreateJobInput): Promise<Job>;
  update(id: string, input: UpdateJobInput): Promise<Job>;
}
