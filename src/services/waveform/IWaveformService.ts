export interface IWaveformService {
  start(episodeId: string): Promise<void>;
}
