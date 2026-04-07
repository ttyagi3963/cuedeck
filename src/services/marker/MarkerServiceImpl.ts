import type { Marker } from "@/contracts/marker";
import { createMarkerSchema, updateMarkerSchema } from "@/contracts/marker";
import { NotFoundError } from "@/contracts/errors";
import type { IMarkerService } from "./IMarkerService";
import type { IMarkerRepository } from "@/repositories/marker/IMarkerRepository";

export class MarkerServiceImpl implements IMarkerService {
  constructor(private readonly markerRepository: IMarkerRepository) {}

  async findByEpisodeId(episodeId: string): Promise<Marker[]> {
    return this.markerRepository.findByEpisodeId(episodeId);
  }

  async create(episodeId: string, input: unknown): Promise<Marker> {
    const { timeSec, type, adIds } = createMarkerSchema.parse(input);

    return this.markerRepository.create(episodeId, timeSec, type, adIds);
  }

  async update(id: string, input: unknown): Promise<Marker> {
    const { timeSec, adIds } = updateMarkerSchema.parse(input);

    const marker = await this.markerRepository.findById(id);
    if (!marker) {
      throw new NotFoundError("Marker");
    }

    return this.markerRepository.update(id, timeSec, adIds);
  }

  async delete(id: string): Promise<void> {
    const marker = await this.markerRepository.findById(id);
    if (!marker) {
      throw new NotFoundError("Marker");
    }
    await this.markerRepository.delete(id);
  }
}
