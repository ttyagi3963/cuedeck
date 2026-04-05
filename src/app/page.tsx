import { episodeRepository } from "@/lib/composition/composition";
import EpisodeList from "./_components/dashboard/EpisodeList";

export default async function DashboardPage() {
  const episodes = await episodeRepository.findAll();

  return (
    <div className="flex flex-col gap-8 p-16">
      <h1 className="text-3xl font-bold text-text-heading">Dashboard</h1>
      <EpisodeList episodes={episodes} />
    </div>
  );
}
