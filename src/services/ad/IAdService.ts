import type { Ad } from "@/contracts/ad";

export interface IAdService {
  findAll(): Promise<Ad[]>;
  findById(id: string): Promise<Ad | null>;
  create(input: unknown): Promise<Ad>;
  delete(id: string): Promise<void>;
}
