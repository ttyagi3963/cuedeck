export interface IJobDispatcher {
  dispatchGenerateVideo(jobId: string): Promise<void>;
  dispatchTranscription(jobId: string): Promise<void>;
  dispatchWaveform(jobId: string): Promise<void>;
}
