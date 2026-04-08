import { useQuery } from "@tanstack/react-query";
import { fetchMarkers } from "@/utils/http";
import type { Marker } from "@/contracts/marker";

export function useMarkers(episodeId: string) {
  return useQuery<Marker[]>({
    queryKey: ["markers", episodeId],
    queryFn: () => fetchMarkers(episodeId),
  });
}
