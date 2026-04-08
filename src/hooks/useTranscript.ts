import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TranscriptPanelState } from "@/contracts/transcript";
import {
  fetchTranscriptPanelState,
  startTranscription,
} from "@/utils/http";

export function useTranscriptPanel(episodeId: string) {
  return useQuery({
    queryKey: ["transcript", episodeId],
    queryFn: () => fetchTranscriptPanelState(episodeId),
    staleTime: 5000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: (query) => {
      const data = query.state.data as TranscriptPanelState | undefined;
      const latestJob = data?.latestJob;

      if (!latestJob) {
        return false;
      }

      return latestJob.status === "QUEUED" || latestJob.status === "PROCESSING"
        ? 2000
        : false;
    },
  });
}

export function useStartTranscription(episodeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => startTranscription(episodeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["transcript", episodeId],
      });
    },
  });
}
