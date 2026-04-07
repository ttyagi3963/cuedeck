import type { Marker } from "@/contracts/marker";
import { createMarkerSchema, updateMarkerSchema } from "@/contracts/marker";
import type { IMarkerService } from "./IMarkerService";
import type { IMarkerRepository } from "@/repositories/marker/IMarkerRepository";

export class MarkerServiceImpl implements IMarkerService {
  constructor(private readonly markerRepository: IMarkerRepository) {}

  async findByEpisodeId(episodeId: string): Promise<Marker[]> {
    return this.markerRepository.findByEpisodeId(episodeId);
  }

  async create(episodeId: string, input: unknown): Promise<Marker> {
    const { timeSec, type, adIds } = createMarkerSchema.parse(input);

    if (adIds.length > 0) {
      return this.markerRepository.createWithAds(
        episodeId,
        timeSec,
        type,
        adIds,
      );
    }

    return this.markerRepository.create(episodeId, timeSec, type);
  }

  async update(id: string, input: unknown): Promise<Marker> {
    const { timeSec, adIds } = updateMarkerSchema.parse(input);

    const marker = await this.markerRepository.findById(id);
    if (!marker) {
      throw new Error("Marker not found");
    }

    if (adIds) {
      return this.markerRepository.updateWithAds(id, timeSec, adIds);
    }

    return this.markerRepository.update(id, timeSec);
  }

  async delete(id: string): Promise<void> {
    const marker = await this.markerRepository.findById(id);
    if (!marker) {
      throw new Error("Marker not found");
    }
    await this.markerRepository.delete(id);
  }
}
