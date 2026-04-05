import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMarker, deleteMarker } from "@/utils/http";
import type { Marker, MarkerType } from "@/contracts/marker";

export function useCreateMarker(episodeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ timeSec, type }: { timeSec: number; type: MarkerType }) =>
      createMarker(episodeId, timeSec, type),
    onMutate: async ({ timeSec, type }) => {
      await queryClient.cancelQueries({ queryKey: ["markers", episodeId] });

      const previousMarkers = queryClient.getQueryData<Marker[]>([
        "markers",
        episodeId,
      ]);

      queryClient.setQueryData<Marker[]>(["markers", episodeId], (old = []) => [
        ...old,
        {
          id: `temp-${Date.now()}`,
          episodeId,
          timeSec,
          type,
          label: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      return { previousMarkers };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMarkers) {
        queryClient.setQueryData(
          ["markers", episodeId],
          context.previousMarkers,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["markers", episodeId] });
    },
  });
}

export function useDeleteMarker(episodeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (markerId: string) => deleteMarker(markerId),
    onMutate: async (markerId) => {
      await queryClient.cancelQueries({ queryKey: ["markers", episodeId] });

      const previousMarkers = queryClient.getQueryData<Marker[]>([
        "markers",
        episodeId,
      ]);

      queryClient.setQueryData<Marker[]>(["markers", episodeId], (old = []) =>
        old.filter((m) => m.id !== markerId),
      );

      return { previousMarkers };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMarkers) {
        queryClient.setQueryData(
          ["markers", episodeId],
          context.previousMarkers,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["markers", episodeId] });
    },
  });
}
