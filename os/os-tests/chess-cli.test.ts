import { createAndInitializeChess } from '../apps/chess';

/** capture logs and return them */
function captureLogs(fn: () => Promise<void>): Promise<string[]> {
  const logs: string[] = [];
  const orig = console.log;
  console.log = (...args: any[]) => { logs.push(args.join(' ')); };
  return fn().then(() => {
    console.log = orig;
    return logs;
  }, err => {
    console.log = orig;
    throw err;
  });
}

describe('chess cli integration', () => {
  test('machine vs machine logs are deterministic', async () => {
    const run = async () => {
      const chess = await createAndInitializeChess({ mode: 'auto', depth: 2 });
      const logs = await captureLogs(() => chess.play());
      await chess.terminate();
      return logs;
    };
    const l1 = await run();
    const l2 = await run();
    expect(l1).toEqual(l2);
  });

  test('deterministic output with deeper search', async () => {
    const run = async () => {
      const chess = await createAndInitializeChess({ mode: 'auto', depth: 3, searchDepth: 3 });
      const logs = await captureLogs(() => chess.play());
      await chess.terminate();
      return logs;
    };
    const l1 = await run();
    const l2 = await run();
    expect(l1).toEqual(l2);
  });
});
