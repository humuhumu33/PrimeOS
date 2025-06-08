/**
 * chess-web Types
 * ---------------
 * Type definitions for the chess-web module.
 */

import { ModelOptions, ModelInterface, ModelResult, ModelState } from '../../model/types';
import { LoggingInterface } from '../../logging';

export interface ChessWebOptions extends ModelOptions {
  /** Port to listen on */
  port?: number;
}

export interface ChessWebInterface extends ModelInterface {
  /** Start the HTTP server */
  start(): Promise<void>;
  getLogger(): LoggingInterface;
}

export type ChessWebResult<T = unknown> = ModelResult<T>;

export interface ChessWebState extends ModelState {
  /** Current port */
  port?: number;
}
