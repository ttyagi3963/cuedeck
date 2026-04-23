import type { IJobDispatcher } from "@/services/job/IJobDispatcher";

/**
 * A durable job dispatcher that relies on the background worker
 * to pick up QUEUED jobs from the database.
 * 
 * Since the JobService already creates jobs in the QUEUED state,
 * this dispatcher doesn't need to do anything immediate;
 * the DurableJobWorker will pick it up on its next poll.
 */
export class DurableJobDispatcher implements IJobDispatcher {
  async dispatchGenerateVideo(jobId: string): Promise<void> {
    // No-op: Job is already QUEUED in DB.
    console.log(`[DurableJobDispatcher] Enqueued generation job: ${jobId}`);
  }

  async dispatchTranscription(jobId: string): Promise<void> {
    // No-op: Job is already QUEUED in DB.
    console.log(`[DurableJobDispatcher] Enqueued transcription job: ${jobId}`);
  }

  async dispatchWaveform(jobId: string): Promise<void> {
    // No-op: Job is already QUEUED in DB.
    console.log(`[DurableJobDispatcher] Enqueued waveform job: ${jobId}`);
  }
}
