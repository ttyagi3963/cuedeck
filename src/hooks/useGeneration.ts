import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Job } from "@/contracts/job";
import { fetchJob, startGeneration } from "@/utils/http";

export function useStartGeneration(episodeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => startGeneration(episodeId),
    onSuccess: (result) => {
      queryClient.setQueryData<Job>(["jobs", result.job.id], result.job);
    },
  });
}

export function useJob(jobId: string | null) {
  return useQuery({
    queryKey: ["jobs", jobId],
    queryFn: () => fetchJob(jobId!),
    enabled: jobId !== null,
    refetchInterval: (query) => {
      const job = query.state.data;
      if (!job) {
        return 1000;
      }

      return job.status === "QUEUED" || job.status === "PROCESSING"
        ? 1000
        : false;
    },
  });
}
