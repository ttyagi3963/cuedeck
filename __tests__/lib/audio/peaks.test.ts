import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  generatePeaks,
  PEAKS_MAGIC,
  PEAKS_VERSION,
  PEAKS_HEADER_BYTES,
} from "@/lib/audio/peaks";
import { getFfmpegBinaryPath } from "@/lib/pipeline/ffmpeg";

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
    ff.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg fixture render exited ${code}`));
    });
  });
}

beforeAll(async () => {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), "peaks-test-"));
  testWavPath = path.join(tmpDir, "sine-2s.wav");
  await renderSineFixture(testWavPath, 2);
}, 15000);

afterAll(async () => {
  if (tmpDir) {
    await rm(tmpDir, { recursive: true, force: true });
  }
});

describe("generatePeaks", () => {
  it("writes a valid header", async () => {
    const result = await generatePeaks(testWavPath);
    expect(result.buffer.subarray(0, 4).toString("ascii")).toBe(PEAKS_MAGIC);
    expect(result.buffer.readUInt32LE(4)).toBe(PEAKS_VERSION);
    expect(result.buffer.readUInt32LE(12)).toBe(result.peakCount);
  });

  it("reports ~2s duration for the 2s sine fixture", async () => {
    const result = await generatePeaks(testWavPath);
    expect(result.durationSec).toBeGreaterThan(1.9);
    expect(result.durationSec).toBeLessThan(2.1);
  });

  it("emits ~40 peaks for 2s at default 20 peaks/sec", async () => {
    const result = await generatePeaks(testWavPath);
    expect(result.peakCount).toBeGreaterThanOrEqual(39);
    expect(result.peakCount).toBeLessThanOrEqual(41);
  });

  it("a full-amplitude sine produces uint8 peaks near 255", async () => {
    const result = await generatePeaks(testWavPath);
    const body = result.buffer.subarray(PEAKS_HEADER_BYTES);
    const max = Math.max(...Array.from(body));
    expect(max).toBeGreaterThan(200);
  });

  it("respects custom peaksPerSecond", async () => {
    const result = await generatePeaks(testWavPath, { peaksPerSecond: 10 });
    expect(result.peaksPerSecond).toBe(10);
    expect(result.peakCount).toBeGreaterThanOrEqual(19);
    expect(result.peakCount).toBeLessThanOrEqual(21);
  });

  it("buffer length = header + peakCount bytes", async () => {
    const result = await generatePeaks(testWavPath);
    expect(result.buffer.length).toBe(PEAKS_HEADER_BYTES + result.peakCount);
  });
});
