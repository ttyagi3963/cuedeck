import type { Marker, MarkerType } from "@/contracts/marker";
import type { Ad } from "@/contracts/ad";
import type { Episode } from "@/contracts/episode";
import type { StartGenerationResult } from "@/contracts/generation";
import type { Job } from "@/contracts/job";
import type { UploadTarget } from "@/contracts/storage";
import type {
  StartTranscriptionResult,
  TranscriptPanelState,
} from "@/contracts/transcript";
import { transcriptPanelStateSchema } from "@/contracts/transcript";

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
  onProgress?: (progress: number) => void;
};

type UploadAdInput = {
  title: string;
  companyName?: string;
  file: File;
  duration: number;
  onProgress?: (progress: number) => void;
};

type UploadMediaKind = "episode" | "ad";

type CreateUploadTargetRequest = {
  kind: UploadMediaKind;
  title: string;
  originalName: string;
  contentType: string;
  size: number;
};

function toUploadContentType(file: File): string {
  return file.type || "video/mp4";
}

async function requestUploadTarget(
  input: CreateUploadTargetRequest,
): Promise<UploadTarget> {
  const res = await fetch("/api/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error ?? "Failed to prepare upload");
  }

  return res.json();
}

function uploadFileToTarget(
  uploadTarget: UploadTarget,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(uploadTarget.method, uploadTarget.url);

    for (const [headerName, headerValue] of Object.entries(uploadTarget.headers)) {
      xhr.setRequestHeader(headerName, headerValue);
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      reject(
        new Error(
          xhr.responseText.trim() || `Upload failed with status ${xhr.status}`,
        ),
      );
    };

    xhr.onerror = () => {
      reject(new Error("Network error while uploading video"));
    };

    xhr.send(file);
  });
}

export async function uploadEpisode({
  title,
  file,
  duration,
  onProgress,
}: UploadEpisodeInput): Promise<Episode> {
  const uploadTarget = await requestUploadTarget({
    kind: "episode",
    title,
    originalName: file.name,
    contentType: toUploadContentType(file),
    size: file.size,
  });

  await uploadFileToTarget(uploadTarget, file, onProgress);

  const res = await fetch("/api/episodes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      duration,
      sourceUrl: uploadTarget.path,
    }),
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
  onProgress,
}: UploadAdInput): Promise<Ad> {
  const uploadTarget = await requestUploadTarget({
    kind: "ad",
    title,
    originalName: file.name,
    contentType: toUploadContentType(file),
    size: file.size,
  });

  await uploadFileToTarget(uploadTarget, file, onProgress);

  const res = await fetch("/api/ads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      companyName: companyName?.trim() || undefined,
      duration,
      videoUrl: uploadTarget.path,
    }),
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

export async function startGeneration(
  episodeId: string,
): Promise<StartGenerationResult> {
  const res = await fetch(`/api/episodes/${episodeId}/generate`, {
    method: "POST",
  });

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error ?? "Failed to start generation");
  }

  return res.json();
}

export async function fetchJob(jobId: string): Promise<Job> {
  const res = await fetch(`/api/jobs/${jobId}`);

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error ?? "Failed to fetch job");
  }

  return res.json();
}

export async function startTranscription(
  episodeId: string,
): Promise<StartTranscriptionResult> {
  const res = await fetch(`/api/episodes/${episodeId}/transcribe`, {
    method: "POST",
  });

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error ?? "Failed to start transcription");
  }

  return res.json();
}

export async function fetchTranscriptPanelState(
  episodeId: string,
): Promise<TranscriptPanelState> {
  const res = await fetch(`/api/episodes/${episodeId}/transcript`);

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error ?? "Failed to fetch transcript");
  }

  return transcriptPanelStateSchema.parse(await res.json());
}
