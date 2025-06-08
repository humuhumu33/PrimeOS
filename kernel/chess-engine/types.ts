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
  ModelState,
  ModelLifecycleState
} from '../os/model/types';
import { LoggingInterface } from '../os/logging';

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
