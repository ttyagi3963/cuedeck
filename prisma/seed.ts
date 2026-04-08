// prisma/seed.ts

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing data
  await prisma.markerAd.deleteMany();
  await prisma.marker.deleteMany();
  await prisma.ad.deleteMany();
  await prisma.transcriptSegment.deleteMany();
  await prisma.job.deleteMany();
  await prisma.episode.deleteMany();

  // Create episodes
  // const episode1 = await prisma.episode.create({
  //   data: {
  //     title:
  //       "The Longevity Expert: The Truth About Ozempic, The Magic Weight Loss Drug & The Link Between Milk & Cancer!",
  //     sourceUrl: "/videos/episodes/episode1.MP4",
  //     duration: 634,
  //     muxStatus: "PENDING",
  //   },
  // });

  // const episode2 = await prisma.episode.create({
  //   data: {
  //     title:
  //       "Deep Sleep Secrets: What Neuroscience Actually Says About Rest & Recovery",
  //     sourceUrl: "/videos/episodes/episode2.mp4",
  //     duration: 596,
  //     muxStatus: "PENDING",
  //   },
  // });

  // // Create ads
  // const ad1 = await prisma.ad.create({
  //   data: {
  //     title: "Night Boost (Intro) v1",
  //     videoUrl: "/videos/ads/ad1.mp4",
  //     duration: 8,
  //     companyName: "Green Coffee",
  //   },
  // });

  // const ad2 = await prisma.ad.create({
  //   data: {
  //     title: "BetterCreative Production",
  //     videoUrl: "/videos/ads/ad2.mp4",
  //     duration: 8,
  //     companyName: "Little Italy",
  //   },
  // });

  // Episode 1 markers
  // const e1m1 = await prisma.marker.create({
  //   data: {
  //     episodeId: episode1.id,
  //     timeSec: 30,
  //     type: "STATIC",
  //     label: "Pre-roll",
  //   },
  // });
  // await prisma.markerAd.create({
  //   data: { markerId: e1m1.id, adId: ad1.id },
  // });

  // const e1m2 = await prisma.marker.create({
  //   data: {
  //     episodeId: episode1.id,
  //     timeSec: 300,
  //     type: "AUTO",
  //     label: "Mid-roll 1",
  //   },
  // });
  // await Promise.all([
  //   prisma.markerAd.create({ data: { markerId: e1m2.id, adId: ad1.id } }),
  //   prisma.markerAd.create({ data: { markerId: e1m2.id, adId: ad2.id } }),
  // ]);

  // const e1m3 = await prisma.marker.create({
  //   data: {
  //     episodeId: episode1.id,
  //     timeSec: 500,
  //     type: "AB",
  //     label: "Mid-roll 2",
  //   },
  // });
  // await Promise.all([
  //   prisma.markerAd.create({ data: { markerId: e1m3.id, adId: ad1.id } }),
  //   prisma.markerAd.create({ data: { markerId: e1m3.id, adId: ad2.id } }),
  // ]);

  // // Episode 2 markers
  // const e2m1 = await prisma.marker.create({
  //   data: {
  //     episodeId: episode2.id,
  //     timeSec: 15,
  //     type: "STATIC",
  //     label: "Pre-roll",
  //   },
  // });
  // await prisma.markerAd.create({
  //   data: { markerId: e2m1.id, adId: ad2.id },
  // });

  // const e2m2 = await prisma.marker.create({
  //   data: {
  //     episodeId: episode2.id,
  //     timeSec: 400,
  //     type: "AUTO",
  //     label: "Mid-roll",
  //   },
  // });
  // await Promise.all([
  //   prisma.markerAd.create({ data: { markerId: e2m2.id, adId: ad1.id } }),
  //   prisma.markerAd.create({ data: { markerId: e2m2.id, adId: ad2.id } }),
  // ]);

  // console.log("Seeded:");
  // console.log(`  2 episodes (634s, 596s)`);
  // console.log(`  2 ads (8s each)`);
  // console.log(`  3 markers on episode 1 (STATIC @30s, AUTO @300s, AB @500s)`);
  // console.log(`  2 markers on episode 2 (STATIC @15s, AUTO @400s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
