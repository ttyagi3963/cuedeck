import Link from "next/link";
import { ROUTES } from "@/lib/constants";

type EpisodeHeaderProps = {
  title: string;
  episodeNumber: number;
  publishedAt: string;
};

export default function EpisodeHeader({
  title,
  episodeNumber,
  publishedAt,
}: EpisodeHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href={ROUTES.ads}
        className="text-sm font-semibold text-text-muted hover:text-text-heading"
      >
        ← Ads
      </Link>
      <h1 className="text-3xl font-bold leading-9 text-text-heading">
        {title}
      </h1>
      <p className="text-base font-semibold text-text-muted">
        Episode {episodeNumber} • {publishedAt}
      </p>
    </div>
  );
}
