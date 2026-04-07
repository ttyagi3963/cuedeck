import type { MarkerAd } from "@/contracts/ad";
import type { Episode } from "@/contracts/episode";
import { BusinessRuleError } from "@/contracts/errors";
import type { Marker } from "@/contracts/marker";
import type {
  GenerationPlan,
  ResolvedGenerationInsertion,
} from "./generation.types";

function sortMarkerAds(markerAds: MarkerAd[]) {
  return [...markerAds].sort((left, right) => left.adId.localeCompare(right.adId));
}

function stableIndex(seed: string, size: number) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash % size;
}

export function resolveMarkerAdForGeneration(marker: Marker): MarkerAd {
  if (marker.markerAds.length === 0) {
    throw new BusinessRuleError(
      `Marker ${marker.id} does not have any ads selected`,
      "MARKER_AD_REQUIRED",
    );
  }

  const sortedMarkerAds = sortMarkerAds(marker.markerAds);

  switch (marker.type) {
    case "STATIC":
      return sortedMarkerAds[0];
    case "AUTO":
      return sortedMarkerAds[stableIndex(marker.id, sortedMarkerAds.length)];
    case "AB":
      return [...sortedMarkerAds].sort((left, right) => {
        if (left.playCount !== right.playCount) {
          return left.playCount - right.playCount;
        }

        return left.adId.localeCompare(right.adId);
      })[0];
  }
}

export function toResolvedGenerationInsertion(
  marker: Marker,
): ResolvedGenerationInsertion {
  const resolvedMarkerAd = resolveMarkerAdForGeneration(marker);

  return {
    markerId: marker.id,
    markerTimeSec: marker.timeSec,
    markerType: marker.type,
    resolvedAd: {
      id: resolvedMarkerAd.ad.id,
      title: resolvedMarkerAd.ad.title,
      companyName: resolvedMarkerAd.ad.companyName ?? null,
      videoUrl: resolvedMarkerAd.ad.videoUrl,
      duration: resolvedMarkerAd.ad.duration,
    },
  };
}

export function createGenerationPlan(
  episode: Episode,
  markers: Marker[],
): GenerationPlan {
  if (markers.length === 0) {
    throw new BusinessRuleError(
      "Add at least one marker before generating a video",
      "GENERATION_MARKERS_REQUIRED",
    );
  }

  return {
    episodeId: episode.id,
    sourceUrl: episode.sourceUrl,
    episodeDuration: episode.duration,
    insertions: markers.map(toResolvedGenerationInsertion),
  };
}
