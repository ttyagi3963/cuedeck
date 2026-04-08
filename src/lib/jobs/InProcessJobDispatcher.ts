import type { IJobDispatcher } from "@/services/job/IJobDispatcher";
import type { JobProcessor } from "./JobProcessor";

export class InProcessJobDispatcher implements IJobDispatcher {
  constructor(private readonly jobProcessor: JobProcessor) {}

  async dispatchGenerateVideo(jobId: string): Promise<void> {
    queueMicrotask(() => {
      void this.jobProcessor.process(jobId);
    });
  }

  async dispatchTranscription(jobId: string): Promise<void> {
    queueMicrotask(() => {
      void this.jobProcessor.process(jobId);
    });
  }
}
