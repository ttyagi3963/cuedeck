import type { Marker } from "@/contracts/marker";

export interface IMarkerService {
  findByEpisodeId(episodeId: string): Promise<Marker[]>;
  create(episodeId: string, input: unknown): Promise<Marker>;
  update(id: string, input: unknown): Promise<Marker>;
  delete(id: string): Promise<void>;
}
