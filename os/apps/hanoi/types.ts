/**
 * hanoi Types
 * =====
 * 
 * Type definitions for the hanoi module.
 */

import {
  ModelOptions,
  ModelInterface,
  ModelResult,
  ModelState
} from '../model/types';
import { LoggingInterface } from '../os/logging';

/**
 * Configuration options for hanoi
 */
export interface HanoiOptions extends ModelOptions {
  /**
   * Number of disks in the puzzle
   */
  disks?: number;

  /**
   * Optional starting tower configuration. Each tower is an array of disk sizes
   * with the smallest disk represented by 1 and the largest by `disks`.
   * The bottom of the tower is the first element in the array.
   */
  towers?: number[][];
}

/**
 * Core interface for hanoi functionality
 */
export interface HanoiInterface extends ModelInterface {
  /**
   * Execute one disk move from one tower to another
   */
  moveDisk(from: number, to: number): HanoiResult;

  /**
   * Automatically solve the puzzle from the current state
   */
  solve(): Promise<HanoiResult<number[][]>>;

  /**
   * Access the module logger
   */
  getLogger(): LoggingInterface;
}

/**
 * Result of hanoi operations
 */
export type HanoiResult<T = unknown> = ModelResult<T>;

/**
 * Extended state for hanoi module
 */
export interface HanoiState extends ModelState {
  /**
   * Current tower configuration
   */
  towers: number[][];

  /**
   * History of moves performed
   */
  moves: Array<{ from: number; to: number; disk: number }>;
}
