import { adService, episodeService } from "@/lib/composition/composition";
import AdList from "./_components/dashboard/AdList";
import EpisodeList from "./_components/dashboard/EpisodeList";
import UploadMediaForm from "./_components/upload/UploadMediaForm";

export default async function DashboardPage() {
  const episodes = await episodeService.findAll();
  const ads = await adService.findAll();

  return (
    <div className="flex flex-col gap-8 p-16">
      <h1 className="text-3xl font-bold text-text-heading">Dashboard</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <UploadMediaForm kind="episode" id="upload-episode" />
        <UploadMediaForm kind="ad" id="upload-ad" />
      </div>
      <EpisodeList episodes={episodes} />
      <AdList ads={ads} />
    </div>
  );
}
