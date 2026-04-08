import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import { InfrastructureError } from "@/lib/errors/InfrastructureError";

const require = createRequire(import.meta.url);
const FFMPEG_EXECUTABLE_NAME = process.platform === "win32"
  ? "ffmpeg.exe"
  : "ffmpeg";

export type RunFfmpegOptions = {
  cwd?: string;
  signal?: AbortSignal;
  logLabel?: string;
  logProgress?: boolean;
};

export type FfmpegExecutionResult = {
  command: string;
  stdout: string;
  stderr: string;
};

function toVirtualRootCandidate(binaryPath: string) {
  const normalizedPath = binaryPath.replace(/\//g, "\\");
  const prefix = "\\ROOT\\";

  if (!normalizedPath.startsWith(prefix)) {
    return null;
  }

  return path.join(process.cwd(), normalizedPath.slice(prefix.length));
}

function getPackageDirectoryCandidate() {
  try {
    const packageJsonPath = require.resolve("ffmpeg-static/package.json");
    return path.join(path.dirname(packageJsonPath), FFMPEG_EXECUTABLE_NAME);
  } catch {
    return null;
  }
}

function getFallbackCandidates(binaryPath: string | null) {
  const candidates = new Set<string>();

  if (binaryPath) {
    candidates.add(binaryPath);

    const virtualRootCandidate = toVirtualRootCandidate(binaryPath);
    if (virtualRootCandidate) {
      candidates.add(virtualRootCandidate);
    }
  }

  candidates.add(
    path.join(
      process.cwd(),
      "node_modules",
      "ffmpeg-static",
      FFMPEG_EXECUTABLE_NAME,
    ),
  );

  const packageDirectoryCandidate = getPackageDirectoryCandidate();
  if (packageDirectoryCandidate) {
    candidates.add(packageDirectoryCandidate);
  }

  return [...candidates];
}

function normalizeFfmpegPath(binaryPath: string | null) {
  const candidates = getFallbackCandidates(binaryPath);
  const resolvedPath = candidates.find((candidate) => existsSync(candidate));

  if (!resolvedPath) {
    throw new InfrastructureError(
      `FFmpeg is not available on this server. Checked: ${candidates.join(", ")}`,
      "FFMPEG_UNAVAILABLE",
    );
  }

  return resolvedPath;
}

function quoteCommandPart(value: string) {
  return /[\s"]/u.test(value) ? JSON.stringify(value) : value;
}

export function getFfmpegBinaryPath() {
  return normalizeFfmpegPath(ffmpegPath);
}

export async function runFfmpeg(
  args: readonly string[],
  options: RunFfmpegOptions = {},
): Promise<FfmpegExecutionResult> {
  const binaryPath = getFfmpegBinaryPath();
  const command = [binaryPath, ...args].map(quoteCommandPart).join(" ");
  const startedAtMs = Date.now();
  const logPrefix = options.logLabel ? `[FFmpeg:${options.logLabel}]` : "[FFmpeg]";

  console.info(`${logPrefix} Starting: ${command}`);

  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, args, {
      cwd: options.cwd,
      signal: options.signal,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let stderrLineBuffer = "";

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      const text = chunk.toString();
      stderr += text;

      if (!options.logProgress) {
        return;
      }

      stderrLineBuffer += text;
      const lines = stderrLineBuffer.split(/\r?\n/u);
      stderrLineBuffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          console.info(`${logPrefix} ${trimmedLine}`);
        }
      }
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (options.logProgress) {
        const finalLine = stderrLineBuffer.trim();
        if (finalLine) {
          console.info(`${logPrefix} ${finalLine}`);
        }
      }
      const durationMs = Date.now() - startedAtMs;

      if (code === 0) {
        console.info(`${logPrefix} Completed in ${durationMs}ms`);
        resolve({ command, stdout, stderr });
        return;
      }

      console.error(`${logPrefix} Failed in ${durationMs}ms`);
      reject(
        new Error(
          [
            `FFmpeg exited with code ${code ?? "unknown"}`,
            `Command: ${command}`,
            stderr.trim(),
          ]
            .filter(Boolean)
            .join("\n"),
        ),
      );
    });
  });
}

export function toFfmpegConcatPath(filePath: string) {
  return filePath.replace(/\\/g, "/").replace(/'/g, "'\\''");
}

export async function createPipelineTempDirectory(prefix = "generate-final-video-") {
  return fs.mkdtemp(path.join(os.tmpdir(), `cuedeck-${prefix}`));
}
