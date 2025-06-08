#!/usr/bin/env node
import { createAndInitializeChess } from '../os/apps/chess';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: { mode?: 'human' | 'auto'; depth?: number; train?: string } = {};
  for (const a of args) {
    if (a.startsWith('--mode=')) {
      opts.mode = a.split('=')[1] as 'human' | 'auto';
    } else if (a.startsWith('--depth=')) {
      opts.depth = parseInt(a.split('=')[1], 10);
    } else if (a.startsWith('--train=')) {
      opts.train = a.split('=')[1];
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  const chess = await createAndInitializeChess(opts);
  await chess.play();
  await chess.terminate();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
