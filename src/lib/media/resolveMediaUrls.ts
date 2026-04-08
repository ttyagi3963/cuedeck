import type { Ad, MarkerAd } from "@/contracts/ad";
import type { Episode } from "@/contracts/episode";
import type { Marker } from "@/contracts/marker";
import type { IStorageService } from "@/services/storage/IStorageService";

export async function resolveEpisodeMediaUrl(
  episode: Episode,
  storageService: IStorageService,
): Promise<Episode> {
  return {
    ...episode,
    sourceUrl: await storageService.getPublicUrl(episode.sourceUrl),
  };
}

export async function resolveEpisodeMediaUrls(
  episodes: readonly Episode[],
  storageService: IStorageService,
): Promise<Episode[]> {
  return Promise.all(
    episodes.map((episode) => resolveEpisodeMediaUrl(episode, storageService)),
  );
}

export async function resolveAdMediaUrl(
  ad: Ad,
  storageService: IStorageService,
): Promise<Ad> {
  return {
    ...ad,
    videoUrl: await storageService.getPublicUrl(ad.videoUrl),
  };
}

export async function resolveAdMediaUrls(
  ads: readonly Ad[],
  storageService: IStorageService,
): Promise<Ad[]> {
  return Promise.all(ads.map((ad) => resolveAdMediaUrl(ad, storageService)));
}

async function resolveMarkerAdMediaUrl(
  markerAd: MarkerAd,
  storageService: IStorageService,
): Promise<MarkerAd> {
  return {
    ...markerAd,
    ad: await resolveAdMediaUrl(markerAd.ad, storageService),
  };
}

export async function resolveMarkerMediaUrl(
  marker: Marker,
  storageService: IStorageService,
): Promise<Marker> {
  return {
    ...marker,
    markerAds: await Promise.all(
      marker.markerAds.map((markerAd) =>
        resolveMarkerAdMediaUrl(markerAd, storageService),
      ),
    ),
  };
}

export async function resolveMarkerMediaUrls(
  markers: readonly Marker[],
  storageService: IStorageService,
): Promise<Marker[]> {
  return Promise.all(
    markers.map((marker) => resolveMarkerMediaUrl(marker, storageService)),
  );
}
