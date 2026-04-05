import { notFound } from "next/navigation";
import {
  episodeRepository,
  markerRepository,
} from "@/lib/composition/composition";
import EditorPage from "@/app/_components/editor/EditorPage";
import EpisodeHeader from "@/app/_components/editor/EpisodeHeader";

type EditorPageParams = {
  params: Promise<{ id: string }>;
};

export default async function EditorRoute({ params }: EditorPageParams) {
  const { id } = await params;
  const episode = await episodeRepository.findById(id);

  if (!episode) {
    notFound();
  }

  const markers = await markerRepository.findByEpisodeId(episode.id);

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
