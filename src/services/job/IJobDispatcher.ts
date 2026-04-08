export interface IJobDispatcher {
  dispatchGenerateVideo(jobId: string): Promise<void>;
  dispatchTranscription(jobId: string): Promise<void>;
}
