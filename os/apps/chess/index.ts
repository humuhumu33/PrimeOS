/**
 * chess Implementation
 * =====
 * 
 * This module implements Chess implementation for PrimeOS.
 * It follows the standard PrimeOS model pattern.
 */

import {
  BaseModel
} from '../../model';
import {
  ChessOptions,
  ChessInterface,
  ChessState
} from './types';
import {
  createAndInitializeChessEngine,
  ChessEngineInterface,
  ChessGame
} from '../../../kernel/chess-engine';
import * as fs from 'fs';
import * as readline from 'readline';
import { Square } from '../../../core/chess-core/types';

/**
 * Default options for chess
 */
const DEFAULT_OPTIONS: ChessOptions = {
  debug: false,
  name: 'chess',
  version: '0.1.0'
};

/**
 * Main implementation of chess
 */
export class ChessImplementation extends BaseModel implements ChessInterface {
  private engine?: ChessEngineInterface;

  /**
   * Create a new chess instance
   */
  constructor(options: ChessOptions = {}) {
    // Initialize BaseModel with options
    super({ ...DEFAULT_OPTIONS, ...options });
    
    // Add any custom initialization here
  }
  
  /**
   * Module-specific initialization logic
   */
  protected async onInitialize(): Promise<void> {
    this.engine = await createAndInitializeChessEngine({ debug: this.options.debug });
    if (this.options.train) {
      try {
        const content = fs.readFileSync(this.options.train, 'utf8');
        const dataset = JSON.parse(content) as ChessGame[];
        await this.engine.train(dataset);
      } catch (err) {
        await this.logger.error('Failed to load training data', err);
      }
    }

    this.state.custom = {
      board: this.engine.getState().custom?.board
    } as ChessState;

    await this.logger.debug('Chess initialized with options', this.options);
  }
  
  /**
   * Process input data with module-specific logic
   */
  protected async onProcess<T = unknown, R = unknown>(input: T): Promise<R> {
    await this.logger.debug('Processing input in Chess', input);
    
    // TODO: Implement actual processing logic here
    // This is just a placeholder - replace with real implementation
    const result = input as unknown as R;
    
    return result;
  }
  
  /**
   * Clean up resources when module is reset
   */
  protected async onReset(): Promise<void> {
    await this.engine?.reset();
    this.state.custom = {
      board: this.engine?.getState().custom?.board
    } as ChessState;
    await this.logger.debug('Resetting Chess');
  }
  
  /**
   * Clean up resources when module is terminated
   */
  protected async onTerminate(): Promise<void> {
    await this.engine?.terminate();
    await this.logger.debug('Terminating Chess');
  }

  async play(): Promise<void> {
    const mode = this.options.mode || 'auto';
    const depth = this.options.depth ?? 1;
    if (!this.engine) {
      throw new Error('Engine not initialized');
    }
    if (mode === 'auto') {
      for (let i = 0; i < depth; i++) {
        const mv = await this.engine.computeMove();
        if (!mv) break;
        console.log(`move ${i + 1}: ${mv.from}${mv.to}`);
        await this.engine.applyMove(mv);
        console.log(this.engine.getState().custom?.board);
      }
    } else {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      for (let i = 0; i < depth; i++) {
        console.log(this.engine.getState().custom?.board);
        const answer: string = await new Promise(resolve => rl.question('Your move: ', resolve));
        const from = answer.slice(0, 2) as Square;
        const to = answer.slice(2, 4) as Square;
        await this.engine.applyMove({ from, to });
        const mv = await this.engine.computeMove();
        if (!mv) break;
        console.log(`engine: ${mv.from}${mv.to}`);
        await this.engine.applyMove(mv);
      }
      rl.close();
    }
    this.state.custom = {
      board: this.engine.getState().custom?.board
    } as ChessState;
  }
}

/**
 * Create a chess instance with the specified options
 */
export function createChess(options: ChessOptions = {}): ChessInterface {
  return new ChessImplementation(options);
}

/**
 * Create and initialize a chess instance in a single step
 */
export async function createAndInitializeChess(options: ChessOptions = {}): Promise<ChessInterface> {
  const instance = createChess(options);
  const result = await instance.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize chess: ${result.error}`);
  }
  
  return instance;
}

// Export types
export * from './types';
