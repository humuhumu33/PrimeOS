/**
 * hanoi Implementation
 * =====
 * 
 * This module implements Tower of Hanoi solver.
 * It follows the standard PrimeOS model pattern.
 */

import {
  BaseModel,
  ModelResult
} from '../../model';
import {
  HanoiOptions,
  HanoiInterface,
  HanoiState,
  HanoiResult
} from './types';

/**
 * Default options for hanoi
 */
const DEFAULT_OPTIONS: HanoiOptions = {
  debug: false,
  name: 'hanoi',
  version: '0.1.0',
  disks: 3
};

/**
 * Main implementation of hanoi
 */
export class HanoiImplementation extends BaseModel implements HanoiInterface {
  protected state: HanoiState;

  constructor(options: HanoiOptions = {}) {
    super({ ...DEFAULT_OPTIONS, ...options });
    this.state = {
      ...super.getState(),
      towers: [[], [], []],
      moves: []
    } as HanoiState;
  }
  
  /**
   * Module-specific initialization logic
   */
  protected async onInitialize(): Promise<void> {
    const disks = this.options.disks || DEFAULT_OPTIONS.disks!;
    if (this.options.towers) {
      this.state.towers = this.options.towers.map(t => [...t]);
    } else {
      this.state.towers = [
        Array.from({ length: disks }, (_, i) => disks - i),
        [],
        []
      ];
    }
    this.state.moves = [];

    await this.logger.debug('Hanoi initialized with options', this.options);
  }
  
  /**
   * Process input data with module-specific logic
   */
  protected async onProcess<T = unknown, R = unknown>(input: T): Promise<R> {
    const command: any = input || { action: 'solve' };

    if (command.action === 'move') {
      const res = this.moveDisk(command.from, command.to);
      return { towers: this.state.towers } as unknown as R;
    }

    await this.solve();
    return { towers: this.state.towers, moves: this.state.moves } as unknown as R;
  }

  moveDisk(from: number, to: number): HanoiResult {
    const source = this.state.towers[from];
    const dest = this.state.towers[to];
    if (!source || !dest) {
      return this.createResult(false, undefined, 'Invalid tower index');
    }
    if (source.length === 0) {
      return this.createResult(false, undefined, 'No disk to move');
    }
    const disk = source[source.length - 1];
    if (dest.length > 0 && dest[dest.length - 1] < disk) {
      return this.createResult(false, undefined, 'Cannot place larger disk on smaller disk');
    }
    source.pop();
    dest.push(disk);
    this.state.moves.push({ from, to, disk });
    return this.createResult(true, { from, to, disk });
  }

  async solve(): Promise<HanoiResult<number[][]>> {
    const maxDisk = Math.max(0, ...this.state.towers.flat());
    await this.solveRecursive(maxDisk, this.findDisk(maxDisk), 2, this.getAuxTower(this.findDisk(maxDisk), 2));
    return this.createResult(true, this.state.towers.map(t => [...t]));
  }

  private async solveRecursive(n: number, from: number, to: number, aux: number): Promise<void> {
    if (n <= 0) return;
    const currentPos = this.findDisk(n);
    if (currentPos !== from) {
      from = currentPos;
      aux = this.getAuxTower(from, to);
    }
    await this.solveRecursive(n - 1, from, aux, to);
    this.moveDisk(this.findDisk(n), to);
    await this.solveRecursive(n - 1, aux, to, from);
  }

  private findDisk(n: number): number {
    for (let i = 0; i < 3; i++) {
      if (this.state.towers[i].includes(n)) return i;
    }
    throw new Error(`Disk ${n} not found`);
  }

  private getAuxTower(from: number, to: number): number {
    return [0, 1, 2].find(i => i !== from && i !== to)!;
  }
  
  /**
   * Clean up resources when module is reset
   */
  protected async onReset(): Promise<void> {
    await this.onInitialize();
  }
  
  /**
   * Clean up resources when module is terminated
   */
  protected async onTerminate(): Promise<void> {
    // Release any module-specific resources
    await this.logger.debug('Terminating Hanoi');
  }
}

/**
 * Create a hanoi instance with the specified options
 */
export function createHanoi(options: HanoiOptions = {}): HanoiInterface {
  return new HanoiImplementation(options);
}

/**
 * Create and initialize a hanoi instance in a single step
 */
export async function createAndInitializeHanoi(options: HanoiOptions = {}): Promise<HanoiInterface> {
  const instance = createHanoi(options);
  const result = await instance.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize hanoi: ${result.error}`);
  }
  
  return instance;
}

// Export types
export * from './types';

// Export TestableInterface implementation for the testing framework
export { default as HanoiTests } from './test';
export { default } from './test';
