import { prisma } from "@/lib/prisma";
import type { Ad, CreateAdInput } from "@/contracts/ad";
import type { IAdRepository } from "./IAdRepository";

export class PrismaAdRepositoryImpl implements IAdRepository {
  async findAll(): Promise<Ad[]> {
    return prisma.ad.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string): Promise<Ad | null> {
    return prisma.ad.findUnique({
      where: { id },
    });
  }

  async create(input: CreateAdInput): Promise<Ad> {
    const { title, companyName, videoUrl, duration } = input;

    return prisma.ad.create({
      data: { title, companyName, videoUrl, duration },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.ad.delete({
      where: { id },
    });
  }
}
