#!/usr/bin/env node
import { createAndInitializeHanoi } from '../os/apps/hanoi';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: { disks?: number; auto: boolean } = { auto: false };
  for (const a of args) {
    if (a.startsWith('--disks=')) {
      opts.disks = parseInt(a.split('=')[1], 10);
    } else if (a === '--auto') {
      opts.auto = true;
    } else if (a === '--no-auto') {
      opts.auto = false;
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  const hanoi = await createAndInitializeHanoi({ disks: opts.disks });

  if (opts.auto) {
    await hanoi.solve();
  }

  console.log(JSON.stringify(hanoi.getState().towers));
  console.log(`Moves: ${hanoi.getState().moves.length}`);
  await hanoi.terminate();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
