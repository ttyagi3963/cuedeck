import { useQuery } from "@tanstack/react-query";
import type { Episode } from "@/contracts/episode";
import { fetchEpisodes } from "@/utils/http";

export function useEpisodes() {
  return useQuery<Episode[]>({
    queryKey: ["episodes"],
    queryFn: fetchEpisodes,
  });
}
