import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadAd, uploadEpisode } from "@/utils/http";

export function useUploadEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadEpisode,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
    },
  });
}

export function useUploadAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadAd,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
  });
}
