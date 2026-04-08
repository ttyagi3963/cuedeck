import "dotenv/config";
import { startDurableJobWorker } from "@/lib/container";

const worker = startDurableJobWorker();

function stopAndExit(signal: NodeJS.Signals) {
  worker.stop();
  process.exit(signal === "SIGINT" ? 130 : 143);
}

process.on("SIGINT", () => stopAndExit("SIGINT"));
process.on("SIGTERM", () => stopAndExit("SIGTERM"));
