/**
 * chess-engine Types
 * ============
 * 
 * Type definitions for the chess-engine module.
 */

import {
  ModelOptions,
  ModelInterface,
  ModelResult,
  ModelState
} from '../../os/model/types';
import { LoggingInterface } from '../../os/logging';
import { BoardState, ChessMove } from '../core/chess-core/types';

/**
 * Configuration options for chess-engine
 */
export interface ChessEngineOptions extends ModelOptions {
  /**
   * Module-specific options go here
   */
  // Add module-specific options here
}

/**
 * Core interface for chess-engine functionality
 */
export interface ChessEngineInterface extends ModelInterface {
  /** Load a board position */
  loadPosition(board: BoardState): Promise<void>;

  /** Compute best move from current position */
  computeMove(): Promise<ChessMove | null>;

  /** Apply a move to the current board */
  applyMove(move: ChessMove): Promise<void>;

  /** Train evaluation tables from dataset */
  train(dataset: ChessGame[]): Promise<void>;
  
  /**
   * Access the module logger
   */
  getLogger(): LoggingInterface;
}

/**
 * Result of chess-engine operations
 */
export type ChessEngineResult<T = unknown> = ModelResult<T>;

/**
 * Extended state for chess-engine module
 */
export interface ChessEngineState extends ModelState {
  /**
   * Module-specific state properties go here
   */
  // Add module-specific state properties here
}

/** Dataset entry for training */
export interface ChessGame {
  initial: BoardState;
  moves: ChessMove[];
  result: '1-0' | '0-1' | '1/2-1/2';
}
