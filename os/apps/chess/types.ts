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
  /**
   * Module-specific options go here
   */
  // Add module-specific options here
}

/**
 * Core interface for chess functionality
 */
export interface ChessInterface extends ModelInterface {
  /**
   * Module-specific methods go here
   */
  // Add module-specific methods here
  
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
  /**
   * Module-specific state properties go here
   */
  // Add module-specific state properties here
}
