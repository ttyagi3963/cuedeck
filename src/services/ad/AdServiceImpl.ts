import type { Ad } from "@/contracts/ad";
import { createAdSchema } from "@/contracts/ad";
import type { IAdService } from "./IAdService";
import type { IAdRepository } from "@/repositories/ad/IAdRepository";

export class AdServiceImpl implements IAdService {
  constructor(private readonly adRepository: IAdRepository) {}

  async findAll(): Promise<Ad[]> {
    return this.adRepository.findAll();
  }

  async findById(id: string): Promise<Ad | null> {
    return this.adRepository.findById(id);
  }

  async create(input: unknown): Promise<Ad> {
    const adInput = createAdSchema.parse(input);
    return this.adRepository.create(adInput);
  }

  async delete(id: string): Promise<void> {
    const ad = await this.adRepository.findById(id);
    if (!ad) {
      throw new Error("Ad not found");
    }
    await this.adRepository.delete(id);
  }
}
