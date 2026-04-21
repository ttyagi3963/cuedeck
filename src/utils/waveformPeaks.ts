import {
  PEAKS_HEADER_BYTES,
  PEAKS_MAGIC,
  PEAKS_VERSION,
  waveformStatusResponseSchema,
  type WaveformStatusResponse,
} from "@/contracts/waveform";

export type ParsedPeaks = {
  peaks: Float32Array;
  durationSec: number;
  peakCount: number;
};

export function parsePeaksBuffer(arrayBuffer: ArrayBuffer): ParsedPeaks {
  if (arrayBuffer.byteLength < PEAKS_HEADER_BYTES) {
    throw new Error(
      `peaks buffer too small: ${arrayBuffer.byteLength} < ${PEAKS_HEADER_BYTES}`,
    );
  }

  const view = new DataView(arrayBuffer);
  const magic = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3),
  );
  if (magic !== PEAKS_MAGIC) {
    throw new Error(`bad peaks magic: "${magic}" (expected "${PEAKS_MAGIC}")`);
  }

  const version = view.getUint32(4, true);
  if (version !== PEAKS_VERSION) {
    throw new Error(
      `unsupported peaks version: ${version} (expected ${PEAKS_VERSION})`,
    );
  }

  const durationMs = view.getUint32(8, true);
  const peakCount = view.getUint32(12, true);
  const expectedLength = PEAKS_HEADER_BYTES + peakCount;
  if (arrayBuffer.byteLength !== expectedLength) {
    throw new Error(
      `peaks length mismatch: header says ${peakCount} peaks (${expectedLength}B) but buffer is ${arrayBuffer.byteLength}B`,
    );
  }

  const body = new Uint8Array(arrayBuffer, PEAKS_HEADER_BYTES, peakCount);
  const peaks = new Float32Array(peakCount);
  for (let i = 0; i < peakCount; i++) {
    peaks[i] = body[i] / 255;
  }

  return {
    peaks,
    durationSec: durationMs / 1000,
    peakCount,
  };
}

export async function fetchPeaks(
  url: string,
  signal?: AbortSignal,
): Promise<ParsedPeaks> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`peaks fetch failed: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return parsePeaksBuffer(buffer);
}

export async function fetchWaveformStatus(
  episodeId: string,
  signal?: AbortSignal,
): Promise<WaveformStatusResponse> {
  const response = await fetch(`/api/episodes/${episodeId}/waveform`, { signal });
  if (!response.ok) {
    throw new Error(
      `waveform status fetch failed: ${response.status} ${response.statusText}`,
    );
  }
  return waveformStatusResponseSchema.parse(await response.json());
}
