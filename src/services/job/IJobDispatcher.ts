export interface IJobDispatcher {
  dispatchGenerateVideo(jobId: string): Promise<void>;
}
