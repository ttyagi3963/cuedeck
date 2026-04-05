import type { Marker, MarkerType } from "@/contracts/marker";

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
): Promise<Marker> {
  const res = await fetch(`/api/episodes/${episodeId}/markers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ timeSec, type }),
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
