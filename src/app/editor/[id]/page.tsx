import { notFound } from "next/navigation";
import { episodeService, markerService } from "@/lib/container";
import EditorPage from "@/app/_components/editor/EditorPage";
import EpisodeHeader from "@/app/_components/editor/EpisodeHeader";

type EditorPageParams = {
  params: Promise<{ id: string }>;
};

export default async function EditorRoute({ params }: EditorPageParams) {
  const { id } = await params;
  const episode = await episodeService.findById(id);

  if (!episode) {
    notFound();
  }

  const markers = await markerService.findByEpisodeId(episode.id);

  return (
    <div className="flex flex-col gap-page-gap p-page-padding">
      <EpisodeHeader
        title={episode.title}
        episodeNumber={503}
        publishedAt={new Date(episode.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      />
      <EditorPage episode={episode} markers={markers} />
    </div>
  );
}
