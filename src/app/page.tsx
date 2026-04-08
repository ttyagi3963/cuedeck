import type { Metadata } from "next";
import { connection } from "next/server";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { adService, episodeService } from "@/lib/container";
import { resolveAdMediaUrls, resolveEpisodeMediaUrls } from "@/lib/media/resolveMediaUrls";
import { storageService } from "@/lib/container";
import AdList from "./_components/dashboard/AdList";
import EpisodeList from "./_components/dashboard/EpisodeList";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage episodes, ads, and upload new media in FlightCast.",
};

export default async function DashboardPage() {
  await connection();

  const queryClient = new QueryClient();
  const [episodes, ads] = await Promise.all([
    episodeService.findAll(),
    adService.findAll(),
  ]);
  const [resolvedEpisodes, resolvedAds] = await Promise.all([
    resolveEpisodeMediaUrls(episodes, storageService),
    resolveAdMediaUrls(ads, storageService),
  ]);
  queryClient.setQueryData(["episodes"], resolvedEpisodes);
  queryClient.setQueryData(["ads"], resolvedAds);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col gap-page-gap p-content-p-xs lg:p-page-padding">
        <h1 className="text-3xl font-bold text-text-heading">Dashboard</h1>

        <EpisodeList />
        <AdList />
      </div>
    </HydrationBoundary>
  );
}
