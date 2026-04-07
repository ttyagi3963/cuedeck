import "server-only";

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import { InfrastructureError } from "@/lib/errors/InfrastructureError";

export type RunFfmpegOptions = {
  cwd?: string;
  signal?: AbortSignal;
};

export type FfmpegExecutionResult = {
  command: string;
  stdout: string;
  stderr: string;
};

function normalizeFfmpegPath(binaryPath: string | null) {
  if (!binaryPath) {
    throw new InfrastructureError(
      "FFmpeg is not available on this server",
      "FFMPEG_UNAVAILABLE",
    );
  }

  return binaryPath;
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

  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, args, {
      cwd: options.cwd,
      signal: options.signal,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      const command = [binaryPath, ...args].map(quoteCommandPart).join(" ");

      if (code === 0) {
        resolve({ command, stdout, stderr });
        return;
      }

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
