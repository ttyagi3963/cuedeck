import { useQuery } from "@tanstack/react-query";
import { fetchMarkers } from "@/utils/http";
import type { Marker } from "@/contracts/marker";

export function useMarkers(episodeId: string, initialData: Marker[]) {
  return useQuery({
    queryKey: ["markers", episodeId],
    queryFn: () => fetchMarkers(episodeId),
    initialData,
  });
}
