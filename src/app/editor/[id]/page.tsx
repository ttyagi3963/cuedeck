import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import {
  episodeService,
  jobService,
  markerService,
  storageService,
} from "@/lib/container";
import {
  resolveEpisodeMediaUrl,
  resolveMarkerMediaUrls,
} from "@/lib/media/resolveMediaUrls";
import EditorPage from "@/app/_components/editor/EditorPage";
import EpisodeHeader from "@/app/_components/editor/EpisodeHeader";

type EditorPageParams = {
  params: Promise<{ id: string }>;
};

const getEpisodeForEditor = cache(async (id: string) => {
  return episodeService.findById(id);
});

export async function generateMetadata({
  params,
}: EditorPageParams): Promise<Metadata> {
  const { id } = await params;
  const episode = await getEpisodeForEditor(id);

  if (!episode) {
    return {
      title: "Episode Not Found",
    };
  }

  return {
    title: `Editing: ${episode.title}`,
    description: `Edit markers, preview renders, and manage transcripts for ${episode.title}.`,
  };
}

export default async function EditorRoute({ params }: EditorPageParams) {
  const { id } = await params;
  const episode = await getEpisodeForEditor(id);
  const queryClient = new QueryClient();

  if (!episode) {
    notFound();
  }

  const [markers, episodes] = await Promise.all([
    markerService.findByEpisodeId(episode.id),
    episodeService.findAll(),
  ]);
  const latestGenerationJob = await jobService.findLatestByEpisodeIdAndType(
    episode.id,
    "GENERATE_VIDEO",
  );
  const episodeIndex = episodes.findIndex((entry) => entry.id === episode.id);
  const episodeNumber =
    episodeIndex === -1 ? 1 : episodes.length - episodeIndex;
  const [resolvedEpisode, resolvedMarkers] = await Promise.all([
    resolveEpisodeMediaUrl(episode, storageService),
    resolveMarkerMediaUrls(markers, storageService),
  ]);
  queryClient.setQueryData(["markers", episode.id], resolvedMarkers);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col gap-page-gap p-content-p-xs lg:p-page-padding">
        <EpisodeHeader
          title={episode.title}
          episodeNumber={episodeNumber}
          publishedAt={new Date(episode.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        />
        <EditorPage
          episode={resolvedEpisode}
          initialGenerationJobId={latestGenerationJob?.id ?? null}
        />
      </div>
    </HydrationBoundary>
  );
}
