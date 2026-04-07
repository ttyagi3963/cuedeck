import { prisma } from "@/lib/prisma";
import type { Ad, CreateAdInput } from "@/contracts/ad";
import type { IAdRepository } from "./IAdRepository";
import { toAd } from "./adMappers";

export class PrismaAdRepositoryImpl implements IAdRepository {
  async findAll(): Promise<Ad[]> {
    const rows = await prisma.ad.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toAd);
  }

  async findById(id: string): Promise<Ad | null> {
    const row = await prisma.ad.findUnique({
      where: { id },
    });
    return row ? toAd(row) : null;
  }

  async create(input: CreateAdInput): Promise<Ad> {
    const { title, companyName, videoUrl, duration } = input;

    const row = await prisma.ad.create({
      data: { title, companyName, videoUrl, duration },
    });
    return toAd(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.ad.delete({
      where: { id },
    });
  }
}
