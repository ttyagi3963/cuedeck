import type { Marker, MarkerType } from "@/contracts/marker";

export interface IMarkerRepository {
  findByEpisodeId(episodeId: string): Promise<Marker[]>;
  findById(id: string): Promise<Marker | null>;
  create(
    episodeId: string,
    timeSec: number,
    type: MarkerType,
    adIds?: string[],
  ): Promise<Marker>;
  update(id: string, timeSec: number, adIds?: string[]): Promise<Marker>;
  delete(id: string): Promise<void>;
}
