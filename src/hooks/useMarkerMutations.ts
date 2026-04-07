import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMarker, deleteMarker, updateMarker } from "@/utils/http";
import type { Marker, MarkerType } from "@/contracts/marker";

export function useCreateMarker(episodeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      timeSec,
      type,
      adIds,
    }: {
      timeSec: number;
      type: MarkerType;
      adIds?: string[];
    }) => createMarker(episodeId, timeSec, type, adIds),
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
          markerAds: [],
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

export function useUpdateMarker(episodeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      markerId,
      timeSec,
      adIds,
    }: {
      markerId: string;
      timeSec: number;
      adIds?: string[];
    }) => updateMarker(markerId, timeSec, adIds),
    onMutate: async ({ markerId, timeSec }) => {
      await queryClient.cancelQueries({ queryKey: ["markers", episodeId] });

      const previousMarkers = queryClient.getQueryData<Marker[]>([
        "markers",
        episodeId,
      ]);

      queryClient.setQueryData<Marker[]>(["markers", episodeId], (old = []) =>
        old.map((m) => (m.id === markerId ? { ...m, timeSec } : m)),
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
