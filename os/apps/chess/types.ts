/**
 * chess Types
 * =====
 * 
 * Type definitions for the chess module.
 */

import {
  ModelOptions,
  ModelInterface,
  ModelResult,
  ModelState,
  ModelLifecycleState
} from '../os/model/types';
import { LoggingInterface } from '../os/logging';

/**
 * Configuration options for chess
 */
export interface ChessOptions extends ModelOptions {
  /** Play mode: human vs machine or machine vs machine */
  mode?: 'human' | 'auto';

  /** Number of half-moves to play in auto mode */
  depth?: number;

  /** Optional path to training dataset */
  train?: string;
}

/**
 * Core interface for chess functionality
 */
export interface ChessInterface extends ModelInterface {
  /** Run the CLI play loop */
  play(): Promise<void>;
  
  /**
   * Access the module logger
   */
  getLogger(): LoggingInterface;
}

/**
 * Result of chess operations
 */
export type ChessResult<T = unknown> = ModelResult<T>;

/**
 * Extended state for chess module
 */
export interface ChessState extends ModelState {
  /** Current board position in FEN notation */
  board?: string;
}
