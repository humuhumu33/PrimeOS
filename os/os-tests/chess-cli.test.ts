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
    const chess = await createAndInitializeChess({ mode: 'auto', depth: 2 });
    const logs = await captureLogs(() => chess.play());
    await chess.terminate();
    expect(logs).toEqual([
      'move 1: a2a3',
      'rnbqkbnr/pppppppp/8/8/8/P7/1PPPPPPP/RNBQKBNR b KQkq - 0 1',
      'move 2: a7a6',
      'rnbqkbnr/1ppppppp/p7/8/8/P7/1PPPPPPP/RNBQKBNR w KQkq - 0 1'
    ]);
  });
});
