import type { Ad as ContractAd } from "@/contracts/ad";
import type { Ad as PrismaAd } from "@/generated/prisma/client";

export function toAd(row: PrismaAd): ContractAd {
  return {
    id: row.id,
    title: row.title,
    companyName: row.companyName,
    videoUrl: row.videoUrl,
    duration: row.duration,
    createdAt: row.createdAt,
  };
}
