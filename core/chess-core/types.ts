/**
 * chess-core Types
 * ==========
 * 
 * Type definitions for the chess-core module.
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
 * Configuration options for chess-core
 */
export interface ChessCoreOptions extends ModelOptions {
  /**
   * Module-specific options go here
   */
  // Add module-specific options here
}

/**
 * Core interface for chess-core functionality
 */
export interface ChessCoreInterface extends ModelInterface {
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
 * Result of chess-core operations
 */
export type ChessCoreResult<T = unknown> = ModelResult<T>;

/**
 * Extended state for chess-core module
 */
export interface ChessCoreState extends ModelState {
  /**
   * Module-specific state properties go here
   */
  // Add module-specific state properties here
}
