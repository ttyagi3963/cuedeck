import type { Marker, MarkerType } from "@/contracts/marker";
import type { Ad } from "@/contracts/ad";
import type { Episode } from "@/contracts/episode";

export async function fetchMarkers(episodeId: string): Promise<Marker[]> {
  const res = await fetch(`/api/episodes/${episodeId}/markers`);

  if (!res.ok) {
    throw new Error("Failed to fetch markers");
  }

  return res.json();
}

export async function createMarker(
  episodeId: string,
  timeSec: number,
  type: MarkerType,
  adIds?: string[],
): Promise<Marker> {
  const res = await fetch(`/api/episodes/${episodeId}/markers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ timeSec, type, adIds }),
  });

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error ?? "Failed to create marker");
  }

  return res.json();
}

export async function deleteMarker(markerId: string): Promise<void> {
  const res = await fetch(`/api/markers/${markerId}`, { method: "DELETE" });

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error ?? "Failed to delete marker");
  }
}

export async function updateMarker(
  markerId: string,
  timeSec: number,
  adIds?: string[],
): Promise<Marker> {
  const body: Record<string, unknown> = { timeSec };
  if (adIds) body.adIds = adIds;

  const res = await fetch(`/api/markers/${markerId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to update marker");
  }

  return res.json();
}

export async function fetchAds(): Promise<Ad[]> {
  const res = await fetch("/api/ads");

  if (!res.ok) {
    throw new Error("Failed to fetch ads");
  }

  return res.json();
}

export async function fetchEpisodes(): Promise<Episode[]> {
  const res = await fetch("/api/episodes");

  if (!res.ok) {
    throw new Error("Failed to fetch episodes");
  }

  return res.json();
}

type UploadEpisodeInput = {
  title: string;
  file: File;
  duration: number;
};

type UploadAdInput = {
  title: string;
  companyName?: string;
  file: File;
  duration: number;
};

export async function uploadEpisode({
  title,
  file,
  duration,
}: UploadEpisodeInput): Promise<Episode> {
  const formData = new FormData();
  formData.set("title", title);
  formData.set("duration", String(duration));
  formData.set("file", file);

  const res = await fetch("/api/episodes", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error ?? "Failed to upload episode");
  }

  return res.json();
}

export async function uploadAd({
  title,
  companyName,
  file,
  duration,
}: UploadAdInput): Promise<Ad> {
  const formData = new FormData();
  formData.set("title", title);
  formData.set("duration", String(duration));
  formData.set("file", file);

  if (companyName?.trim()) {
    formData.set("companyName", companyName.trim());
  }

  const res = await fetch("/api/ads", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error ?? "Failed to upload ad");
  }

  return res.json();
}

export async function deleteEpisode(episodeId: string): Promise<void> {
  const res = await fetch(`/api/episodes/${episodeId}`, { method: "DELETE" });

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error ?? "Failed to delete episode");
  }
}

export async function deleteAd(adId: string): Promise<void> {
  const res = await fetch(`/api/ads/${adId}`, { method: "DELETE" });

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error ?? "Failed to delete ad");
  }
}
