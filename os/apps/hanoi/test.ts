import { createAndInitializeHanoi, HanoiInterface } from './index';

function isSolved(state: HanoiInterface['getState']) {
  const towers = (typeof state === 'function' ? state() : state).towers;
  const n = Math.max(...towers.flat(), 0);
  return (
    towers[0].length === 0 &&
    towers[1].length === 0 &&
    towers[2].join(',') === Array.from({ length: n }, (_, i) => n - i).join(',')
  );
}

describe('hanoi solver', () => {
  test('solves default configuration', async () => {
    const h: HanoiInterface = await createAndInitializeHanoi({ disks: 3 });
    await h.solve();
    expect(isSolved(() => h.getState())).toBe(true);
    expect(h.getState().moves.length).toBe(7);
    await h.terminate();
  });

  test('solves custom starting state', async () => {
    const towers = [[], [3, 2, 1], []];
    const h: HanoiInterface = await createAndInitializeHanoi({ disks: 3, towers });
    await h.solve();
    expect(isSolved(() => h.getState())).toBe(true);
    await h.terminate();
  });
});

