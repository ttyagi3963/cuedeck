import { useQuery } from "@tanstack/react-query";
import type { Ad } from "@/contracts/ad";
import { fetchAds } from "@/utils/http";

export function useAds(initialData?: Ad[]) {
  return useQuery<Ad[]>({
    queryKey: ["ads"],
    queryFn: fetchAds,
    initialData,
  });
}
