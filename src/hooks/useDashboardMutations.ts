import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAd, deleteEpisode } from "@/utils/http";
import type { Ad } from "@/contracts/ad";
import type { Episode } from "@/contracts/episode";

export function useDeleteEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (episodeId: string) => deleteEpisode(episodeId),
    onMutate: async (episodeId) => {
      await queryClient.cancelQueries({ queryKey: ["episodes"] });

      const previousEpisodes = queryClient.getQueryData<Episode[]>(["episodes"]);

      queryClient.setQueryData<Episode[]>(["episodes"], (old = []) =>
        old.filter((episode) => episode.id !== episodeId),
      );

      return { previousEpisodes };
    },
    onError: (_error, _vars, context) => {
      if (context?.previousEpisodes) {
        queryClient.setQueryData(["episodes"], context.previousEpisodes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
    },
  });
}

export function useDeleteAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adId: string) => deleteAd(adId),
    onMutate: async (adId) => {
      await queryClient.cancelQueries({ queryKey: ["ads"] });

      const previousAds = queryClient.getQueryData<Ad[]>(["ads"]);

      queryClient.setQueryData<Ad[]>(["ads"], (old = []) =>
        old.filter((ad) => ad.id !== adId),
      );

      return { previousAds };
    },
    onError: (_error, _vars, context) => {
      if (context?.previousAds) {
        queryClient.setQueryData(["ads"], context.previousAds);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
  });
}
