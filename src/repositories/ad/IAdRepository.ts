import type { Ad, CreateAdInput } from "@/contracts/ad";

export interface IAdRepository {
  findAll(): Promise<Ad[]>;
  findById(id: string): Promise<Ad | null>;
  create(input: CreateAdInput): Promise<Ad>;
  delete(id: string): Promise<void>;
}
