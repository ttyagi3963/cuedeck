import type { Marker, MarkerType } from "@/contracts/marker";

export interface IMarkerRepository {
  findByEpisodeId(episodeId: string): Promise<Marker[]>;
  findById(id: string): Promise<Marker | null>;
  create(episodeId: string, timeSec: number, type: MarkerType): Promise<Marker>;
  delete(id: string): Promise<void>;
}
