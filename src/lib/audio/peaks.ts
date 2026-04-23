import { spawn } from "node:child_process";
import { getFfmpegBinaryPath } from "@/lib/pipeline/ffmpeg";
import { InfrastructureError } from "@/lib/errors/InfrastructureError";
import {
  PEAKS_HEADER_BYTES,
  PEAKS_MAGIC,
  PEAKS_VERSION,
} from "@/contracts/waveform";

export { PEAKS_HEADER_BYTES, PEAKS_MAGIC, PEAKS_VERSION };

export type GeneratePeaksOptions = {
  peaksPerSecond?: number;
  sampleRate?: number;
  signal?: AbortSignal;
};

export type PeaksResult = {
  buffer: Buffer;
  durationSec: number;
  peaksPerSecond: number;
  peakCount: number;
};

const DEFAULT_PEAKS_PER_SECOND = 20;
const DEFAULT_SAMPLE_RATE = 8000;

export async function generatePeaks(
  inputPath: string,
  options: GeneratePeaksOptions = {},
): Promise<PeaksResult> {
  const peaksPerSecond = options.peaksPerSecond ?? DEFAULT_PEAKS_PER_SECOND;
  const sampleRate = options.sampleRate ?? DEFAULT_SAMPLE_RATE;
  const samplesPerPeak = Math.max(1, Math.floor(sampleRate / peaksPerSecond));

  const ffmpegPath = getFfmpegBinaryPath();
  const ffmpeg = spawn(
    ffmpegPath,
    [
      "-i", inputPath,
      "-ac", "1",
      "-ar", String(sampleRate),
      "-f", "s16le",
      "-",
    ],
    { signal: options.signal, windowsHide: true },
  );

  const peaks: number[] = [];
  let bucketPeak = 0;
  let bucketSampleCount = 0;
  let leftover = Buffer.alloc(0);
  let durationSec = 0;
  let stderr = "";

  ffmpeg.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
    if (durationSec === 0) {
      const match = stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
      if (match) {
        durationSec =
          Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
      }
    }
  });

  for await (const chunk of ffmpeg.stdout as AsyncIterable<Buffer>) {
    const combined = Buffer.concat([leftover, chunk]);
    const completeBytes = combined.length - (combined.length % 2);
    leftover = combined.subarray(completeBytes);

    for (let i = 0; i < completeBytes; i += 2) {
      const sample = combined.readInt16LE(i);
      const abs = sample < 0 ? -sample : sample;
      if (abs > bucketPeak) bucketPeak = abs;
      bucketSampleCount++;

      if (bucketSampleCount >= samplesPerPeak) {
        peaks.push(bucketPeak);
        bucketPeak = 0;
        bucketSampleCount = 0;
      }
    }
  }

  if (bucketSampleCount > 0) {
    peaks.push(bucketPeak);
  }

  const exitCode: number = await new Promise((resolve) =>
    ffmpeg.on("close", (code) => resolve(code ?? 0)),
  );
  if (exitCode !== 0) {
    throw new InfrastructureError(
      `ffmpeg exited with code ${exitCode} for ${inputPath}`,
      "PEAKS_FFMPEG_FAILED",
    );
  }

  const buffer = encodePeaks({ peaks, durationSec, peaksPerSecond });
  return {
    buffer,
    durationSec,
    peaksPerSecond,
    peakCount: peaks.length,
  };
}

function encodePeaks(input: {
  peaks: number[];
  durationSec: number;
  peaksPerSecond: number;
}): Buffer {
  const { peaks, durationSec, peaksPerSecond } = input;
  const buffer = Buffer.alloc(PEAKS_HEADER_BYTES + peaks.length);

  buffer.write(PEAKS_MAGIC, 0, "ascii");
  buffer.writeUInt32LE(PEAKS_VERSION, 4);
  buffer.writeUInt32LE(Math.round(durationSec * 1000), 8);
  buffer.writeUInt32LE(peaks.length, 12);

  const bodyOffset = PEAKS_HEADER_BYTES;
  for (let i = 0; i < peaks.length; i++) {
    // peaks[i] is the raw absolute int16 (0..32767). Quantize to 0..255.
    const normalized = Math.min(255, Math.round((peaks[i] * 255) / 32767));
    buffer.writeUInt8(normalized, bodyOffset + i);
  }

  // Second pass optimization: set peaksPerSecond — we ran out of header slots
  // in v1, so it's implied by (peakCount / durationSec). Assert reasonable
  // agreement as a sanity check.
  const implied = peaks.length / Math.max(durationSec, Number.EPSILON);
  if (Math.abs(implied - peaksPerSecond) > peaksPerSecond * 0.5) {
    // not fatal; only happens if ffmpeg reports a weird duration
    console.warn(
      `[peaks] peaksPerSecond drift: requested=${peaksPerSecond} implied=${implied.toFixed(2)}`,
    );
  }

  return buffer;
}
