import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { generatePeaks } from "@/lib/audio/peaks";
import { getFfmpegBinaryPath } from "@/lib/pipeline/ffmpeg";
import {
  parsePeaksBuffer,
  slicePeaks,
  type ParsedPeaks,
} from "@/utils/waveformPeaks";
import { PEAKS_HEADER_BYTES, PEAKS_MAGIC } from "@/contracts/waveform";

let tmpDir: string;
let testWavPath: string;

async function renderSineFixture(outputPath: string, seconds: number) {
  await new Promise<void>((resolve, reject) => {
    const ff = spawn(
      getFfmpegBinaryPath(),
      [
        "-y",
        "-f", "lavfi",
        "-i", `sine=frequency=440:duration=${seconds}`,
        "-af", "volume=8",
        "-ac", "1",
        "-ar", "44100",
        outputPath,
      ],
      { windowsHide: true },
    );
    ff.on("error", reject);
    ff.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)),
    );
  });
}

beforeAll(async () => {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), "peaks-parser-"));
  testWavPath = path.join(tmpDir, "sine-2s.wav");
  await renderSineFixture(testWavPath, 2);
}, 15000);

afterAll(async () => {
  if (tmpDir) await rm(tmpDir, { recursive: true, force: true });
});

describe("parsePeaksBuffer", () => {
  it("round-trips a server-generated buffer", async () => {
    const result = await generatePeaks(testWavPath);
    // Node's Buffer.buffer can be typed as ArrayBuffer | SharedArrayBuffer.
    // generatePeaks produces a plain ArrayBuffer-backed Buffer; assert for tsc.
    const underlying = result.buffer.buffer as ArrayBuffer;
    const arrayBuffer = underlying.slice(
      result.buffer.byteOffset,
      result.buffer.byteOffset + result.buffer.byteLength,
    );

    const parsed = parsePeaksBuffer(arrayBuffer);

    expect(parsed.peakCount).toBe(result.peakCount);
    expect(parsed.durationSec).toBeCloseTo(result.durationSec, 3);
    expect(parsed.peaks.length).toBe(result.peakCount);
    expect(parsed.peaks.every((v) => v >= 0 && v <= 1)).toBe(true);
    expect(Math.max(...parsed.peaks)).toBeGreaterThan(0.78);
  });

  it("rejects a buffer with bad magic", () => {
    const buf = new ArrayBuffer(PEAKS_HEADER_BYTES + 4);
    const view = new DataView(buf);
    view.setUint8(0, 0x58); // 'X'
    view.setUint8(1, 0x58);
    view.setUint8(2, 0x58);
    view.setUint8(3, 0x58);
    view.setUint32(4, 1, true);
    view.setUint32(8, 1000, true);
    view.setUint32(12, 4, true);
    expect(() => parsePeaksBuffer(buf)).toThrow(/magic/);
  });

  it("rejects a buffer shorter than the header", () => {
    const buf = new ArrayBuffer(8);
    expect(() => parsePeaksBuffer(buf)).toThrow(/too small/);
  });

  it("rejects a buffer with mismatched declared peakCount", () => {
    const buf = new ArrayBuffer(PEAKS_HEADER_BYTES + 10);
    const view = new DataView(buf);
    for (let i = 0; i < PEAKS_MAGIC.length; i++) {
      view.setUint8(i, PEAKS_MAGIC.charCodeAt(i));
    }
    view.setUint32(4, 1, true);
    view.setUint32(8, 1000, true);
    view.setUint32(12, 999, true); // lie about peak count
    expect(() => parsePeaksBuffer(buf)).toThrow(/length mismatch/);
  });
});

describe("slicePeaks", () => {
  function makePeaks(peaks: number[], durationSec: number): ParsedPeaks {
    const float = new Float32Array(peaks);
    return { peaks: float, durationSec, peakCount: float.length };
  }

  it("returns the full array when the range covers the entire duration", () => {
    // Integer values — Float32Array represents integers exactly, no precision
    // drift. Fractional values would need toBeCloseTo per element.
    const p = makePeaks([1, 2, 3, 4], 4);
    const slice = slicePeaks(p, 0, 4);
    expect(Array.from(slice)).toEqual([1, 2, 3, 4]);
  });

  it("returns the first half for [0, duration/2]", () => {
    const p = makePeaks([1, 2, 3, 4, 5, 6, 7, 8], 8);
    const slice = slicePeaks(p, 0, 4);
    expect(Array.from(slice)).toEqual([1, 2, 3, 4]);
  });

  it("returns the trailing portion for a mid-range window", () => {
    const p = makePeaks([1, 2, 3, 4, 5, 6, 7, 8], 8);
    const slice = slicePeaks(p, 4, 8);
    expect(Array.from(slice)).toEqual([5, 6, 7, 8]);
  });

  it("clamps out-of-range endSec to the array end", () => {
    const p = makePeaks([1, 2, 3, 4], 4);
    const slice = slicePeaks(p, 2, 999);
    expect(Array.from(slice)).toEqual([3, 4]);
  });

  it("clamps negative startSec to the array start", () => {
    const p = makePeaks([1, 2, 3, 4], 4);
    const slice = slicePeaks(p, -10, 2);
    expect(Array.from(slice)).toEqual([1, 2]);
  });

  it("returns an empty array for a zero-length range", () => {
    const p = makePeaks([1, 2, 3, 4], 4);
    expect(slicePeaks(p, 2, 2).length).toBe(0);
  });

  it("returns an empty array for an inverted range", () => {
    const p = makePeaks([1, 2, 3, 4], 4);
    expect(slicePeaks(p, 3, 1).length).toBe(0);
  });

  it("returns an empty array when the source has zero duration", () => {
    const p = makePeaks([1, 2, 3, 4], 0);
    expect(slicePeaks(p, 0, 10).length).toBe(0);
  });

  it("handles non-integer index boundaries with floor(start) and ceil(end)", () => {
    // 10 peaks over 10 seconds: 1 peak per second
    // Range [2.5, 5.5] → start floor = 2, end ceil = 6 → peaks[2..6]
    const p = makePeaks([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10);
    const slice = slicePeaks(p, 2.5, 5.5);
    expect(Array.from(slice)).toEqual([3, 4, 5, 6]);
  });
});
