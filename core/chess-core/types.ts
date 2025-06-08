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

/**
 * Enumeration of all chess pieces using standard FEN notation
 */
export enum ChessPiece {
  WhitePawn = 'P',
  WhiteKnight = 'N',
  WhiteBishop = 'B',
  WhiteRook = 'R',
  WhiteQueen = 'Q',
  WhiteKing = 'K',
  BlackPawn = 'p',
  BlackKnight = 'n',
  BlackBishop = 'b',
  BlackRook = 'r',
  BlackQueen = 'q',
  BlackKing = 'k'
}

/**
 * Algebraic board coordinate like `a1` or `h8`
 */
export type Square = `${'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;

/**
 * Representation of a full chess board state.
 * Only information needed for FEN conversion is included.
 */
export interface BoardState {
  /** Mapping of squares to pieces (omitted squares are empty) */
  pieces: Partial<Record<Square, ChessPiece>>;

  /** which side is to move */
  activeColor: 'w' | 'b';

  /** castling rights string e.g. "KQkq" or '-' */
  castling: string;

  /** en-passant target square or null */
  enPassant: Square | null;

  /** halfmove clock */
  halfmove: number;

  /** fullmove number */
  fullmove: number;
}

/**
 * Basic chess move
 */
export interface ChessMove {
  from: Square;
  to: Square;
  promotion?: ChessPiece;
}
