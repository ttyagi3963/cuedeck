import Link from "next/link";
import type { Episode } from "@/contracts/episode";

type EpisodeListProps = {
  episodes: Episode[];
};

export default function EpisodeList({ episodes }: EpisodeListProps) {
  if (episodes.length === 0) {
    return (
      <p className="text-base font-semibold text-text-muted">
        No episodes found
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {episodes.map((episode) => (
        <Link
          key={episode.id}
          href={`/editor/${episode.id}`}
          className="group flex flex-col gap-3 rounded-xl border border-border-default bg-surface p-4 transition-colors hover:border-interactive-primary"
        >
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            <video
              src={episode.sourceUrl}
              className="h-full w-full object-cover"
              preload="metadata"
              muted
            />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="line-clamp-2 text-sm font-semibold text-text-heading group-hover:text-interactive-primary">
              {episode.title}
            </h3>
            <p className="text-xs text-text-muted">
              {Math.floor(episode.duration / 60)}m{" "}
              {Math.floor(episode.duration % 60)}s
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
