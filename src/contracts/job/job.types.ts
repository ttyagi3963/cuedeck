export const JOB_TYPES = [
  "TRANSCRIBE",
  "WAVEFORM",
  "GENERATE_VIDEO",
] as const;

export type JobType = (typeof JOB_TYPES)[number];

export const JOB_STATUSES = [
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  episodeId: string;
  progress: number;
  error: string | null;
  payload: JsonValue | null;
  result: JsonValue | null;
  retryCount: number;
  maxRetries: number;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateJobInput {
  type: JobType;
  episodeId: string;
  status?: JobStatus;
  progress?: number;
  error?: string | null;
  payload?: JsonValue | null;
  result?: JsonValue | null;
  retryCount?: number;
  maxRetries?: number;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

export interface UpdateJobInput {
  status?: JobStatus;
  progress?: number;
  error?: string | null;
  payload?: JsonValue | null;
  result?: JsonValue | null;
  retryCount?: number;
  maxRetries?: number;
  startedAt?: Date | null;
  completedAt?: Date | null;
}
