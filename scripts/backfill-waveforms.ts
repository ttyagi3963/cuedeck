import "dotenv/config";
import { episodeService, waveformService } from "@/lib/container";

async function main() {
  const all = await episodeService.findAll();
  const todo = all.filter((episode) => !episode.waveformUrl);

  console.log(
    `[backfill] ${all.length} episodes total — ${todo.length} missing waveforms`,
  );
  if (todo.length === 0) {
    return;
  }

  let enqueued = 0;
  let failed = 0;

  for (const episode of todo) {
    try {
      await waveformService.start(episode.id);
      enqueued++;
      console.log(
        `[backfill] ${enqueued}/${todo.length} enqueued: ${episode.id} — ${episode.title}`,
      );
    } catch (error) {
      failed++;
      console.error(
        `[backfill] FAILED: ${episode.id} — ${episode.title}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  console.log(`[backfill] done. enqueued=${enqueued} failed=${failed}`);
  console.log(
    "[backfill] Jobs are QUEUED. Run the worker (npm run jobs:worker) to process them.",
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[backfill] fatal:", err);
    process.exit(1);
  });
