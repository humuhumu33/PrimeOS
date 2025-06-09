/**
 * chess-engine Implementation
 * ============
 * 
 * This module implements ChessEngine implementation for PrimeOS.
 * It follows the standard PrimeOS model pattern.
 */

import { BaseModel } from '../../os/model';
import {
  ChessEngineOptions,
  ChessEngineInterface,
  ChessGame
} from './types';
import { BoardState, ChessMove, ChessPiece, Square } from '../core/chess-core/types';
import { fenToBoardState, boardStateToFen } from '../core/chess-core/board';
import { ChunkType, StandardOpcodes } from '../core/encoding/core/types';
import { EnhancedChunkVM } from '../core/encoding/vm/vm-enhanced';
import { createMoveGenerationProgram, decodeMoveOutput, createCheckProgram, decodeCheckOutput } from './vm-moves';

/**
 * Default options for chess-engine
 */
const DEFAULT_OPTIONS: ChessEngineOptions = {
  debug: false,
  name: 'chess-engine',
  version: '0.1.0'
};

/**
 * Main implementation of chess-engine
 */
export class ChessEngineImplementation extends BaseModel implements ChessEngineInterface {
  private board: BoardState;
  private vm: EnhancedChunkVM;
  private evalTable: Record<ChessPiece, number>;

  constructor(options: ChessEngineOptions = {}) {
    super({ ...DEFAULT_OPTIONS, ...options });

    this.vm = new EnhancedChunkVM();
    this.board = fenToBoardState(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    );
    this.evalTable = {
      [ChessPiece.WhitePawn]: 1,
      [ChessPiece.BlackPawn]: 1,
      [ChessPiece.WhiteKnight]: 3,
      [ChessPiece.BlackKnight]: 3,
      [ChessPiece.WhiteBishop]: 3,
      [ChessPiece.BlackBishop]: 3,
      [ChessPiece.WhiteRook]: 5,
      [ChessPiece.BlackRook]: 5,
      [ChessPiece.WhiteQueen]: 9,
      [ChessPiece.BlackQueen]: 9,
      [ChessPiece.WhiteKing]: 0,
      [ChessPiece.BlackKing]: 0
    };
  }

  protected async onInitialize(): Promise<void> {
    this.state.custom = {
      board: boardStateToFen(this.board),
      evalTable: { ...this.evalTable }
    } as any;

    await this.logger.debug('ChessEngine initialized with options', this.options);
  }

  protected async onProcess<T = unknown, R = unknown>(input: T): Promise<R> {
    // Pass-through
    return input as unknown as R;
  }

  protected async onReset(): Promise<void> {
    this.board = fenToBoardState(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    );
    this.state.custom = {
      board: boardStateToFen(this.board),
      evalTable: { ...this.evalTable }
    } as any;
  }

  protected async onTerminate(): Promise<void> {
    // nothing special
  }

  async loadPosition(board: BoardState): Promise<void> {
    this.board = { ...board };
    this.state.custom = {
      ...this.state.custom,
      board: boardStateToFen(this.board)
    } as any;
  }

  private evaluationProgram(board: BoardState): any[] {
    const program: any[] = [];
    program.push({
      type: 'operation',
      opcode: StandardOpcodes.OP_PUSH,
      operand: 0
    });
    for (const piece of Object.values(board.pieces)) {
      if (!piece) continue;
      const sign = piece === piece.toUpperCase() ? 1 : -1;
      const value = this.evalTable[piece as ChessPiece] * sign;
      program.push({
        type: 'operation',
        opcode: StandardOpcodes.OP_PUSH,
        operand: value
      });
      program.push({ type: 'operation', opcode: StandardOpcodes.OP_ADD });
    }
    program.push({ type: 'operation', opcode: StandardOpcodes.OP_PRINT });
    return program.map(op => ({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: op.opcode, operand: op.operand } }));
  }

  private generateMoves(board: BoardState): ChessMove[] {
    const moves: ChessMove[] = [];
    const files = ['a','b','c','d','e','f','g','h'];

    const addMove = (from: Square, toFile: number, toRank: number) => {
      if (toFile < 0 || toFile > 7 || toRank < 1 || toRank > 8) return;
      const to = `${files[toFile]}${toRank}` as Square;
      const target = board.pieces[to];
      const piece = board.pieces[from]!;
      const isWhite = piece === piece.toUpperCase();
      if (target && (target === target.toUpperCase()) === isWhite) return;
      moves.push({ from, to });
    };

    for (const [sq, piece] of Object.entries(board.pieces) as [Square, ChessPiece][]) {
      if (!piece) continue;
      const isWhite = piece === piece.toUpperCase();
      if ((board.activeColor === 'w') !== isWhite) continue;
      const file = files.indexOf(sq[0]);
      const rank = Number(sq[1]);

      switch (piece) {
        case ChessPiece.WhitePawn:
        case ChessPiece.BlackPawn: {
          const dir = isWhite ? 1 : -1;
          addMove(sq, file, rank + dir);
          addMove(sq, file - 1, rank + dir);
          addMove(sq, file + 1, rank + dir);
          break;
        }
        case ChessPiece.WhiteKnight:
        case ChessPiece.BlackKnight: {
          const offs = [
            [1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]
          ];
          for (const [dx,dy] of offs) addMove(sq, file+dx, rank+dy);
          break;
        }
        case ChessPiece.WhiteBishop:
        case ChessPiece.BlackBishop: {
          const dirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
          for (const [dx,dy] of dirs) addMove(sq, file+dx, rank+dy);
          break;
        }
        case ChessPiece.WhiteRook:
        case ChessPiece.BlackRook: {
          const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
          for (const [dx,dy] of dirs) addMove(sq, file+dx, rank+dy);
          break;
        }
        case ChessPiece.WhiteQueen:
        case ChessPiece.BlackQueen: {
          const dirs = [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
          for (const [dx,dy] of dirs) addMove(sq, file+dx, rank+dy);
          break;
        }
        case ChessPiece.WhiteKing:
        case ChessPiece.BlackKing: {
          const dirs = [[1,1],[1,0],[1,-1],[0,1],[0,-1],[-1,1],[-1,0],[-1,-1]];
          for (const [dx,dy] of dirs) addMove(sq, file+dx, rank+dy);
          break;
        }
      }
    }

    const legal: ChessMove[] = [];
    for (const m of moves) {
      const copy = JSON.parse(JSON.stringify(board)) as BoardState;
      this.applyMoveTo(copy, m);
      if (!this.isKingInCheck(copy, board.activeColor)) legal.push(m);
    }
    return legal;
  }

  private isKingInCheck(board: BoardState, color: 'w' | 'b'): boolean {
    const prog = createCheckProgram(board, color);
    const out = this.vm.execute(prog as any);
    return decodeCheckOutput(out);
  }

  private movesProgram(board: BoardState): { program: any[]; moves: ChessMove[] } {
    const program = createMoveGenerationProgram(board);
    const raw = decodeMoveOutput(this.vm.execute(program as any));
    const moves = this.generateMoves(board);
    const chunks: any[] = [];
    for (const m of raw) {
      const str = `${m.from}${m.to} `;
      for (const ch of str) {
        chunks.push({ type: ChunkType.DATA, checksum: 0n, data: { value: ch.charCodeAt(0) } });
      }
    }
    return { program: chunks, moves };
  }

  async computeMove(): Promise<ChessMove | null> {
    const { program, moves } = this.movesProgram(this.board);
    this.vm.execute(program as any);

    if (moves.length === 0) {
      const _gameOver = this.isKingInCheck(this.board, this.board.activeColor);
      return null;
    }

    let best = moves[0];
    let bestEval = -Infinity;
    if (this.board.activeColor === 'b') bestEval = Infinity;

    for (const move of moves) {
      const temp = JSON.parse(JSON.stringify(this.board)) as BoardState;
      this.applyMoveTo(temp, move);
      const prog = this.evaluationProgram(temp);
      const out = this.vm.execute(prog as any);
      const val = parseInt(out[out.length-1] || '0', 10);
      if (this.board.activeColor === 'w') {
        if (val > bestEval) { bestEval = val; best = move; }
      } else {
        if (val < bestEval) { bestEval = val; best = move; }
      }
    }

    return best;
  }

  private applyMoveTo(board: BoardState, move: ChessMove) {
    const piece = board.pieces[move.from];
    if (!piece) return;
    const isWhite = piece === piece.toUpperCase();

    // handle castling move
    if (piece === ChessPiece.WhiteKing && move.from === 'e1' && (move.to === 'g1' || move.to === 'c1')) {
      if (move.to === 'g1') {
        board.pieces['f1' as Square] = board.pieces['h1' as Square];
        delete board.pieces['h1' as Square];
      } else {
        board.pieces['d1' as Square] = board.pieces['a1' as Square];
        delete board.pieces['a1' as Square];
      }
    }
    if (piece === ChessPiece.BlackKing && move.from === 'e8' && (move.to === 'g8' || move.to === 'c8')) {
      if (move.to === 'g8') {
        board.pieces['f8' as Square] = board.pieces['h8' as Square];
        delete board.pieces['h8' as Square];
      } else {
        board.pieces['d8' as Square] = board.pieces['a8' as Square];
        delete board.pieces['a8' as Square];
      }
    }

    // en passant capture
    if (piece.toLowerCase() === 'p' && move.to === board.enPassant) {
      const epCap = isWhite ? `${move.to[0]}${Number(move.to[1]) - 1}` as Square : `${move.to[0]}${Number(move.to[1]) + 1}` as Square;
      delete board.pieces[epCap];
    }

    delete board.pieces[move.from];
    board.pieces[move.to] = move.promotion ?? piece;

    // update castling rights
    if (piece === ChessPiece.WhiteKing) {
      board.castling = board.castling.replace('K','').replace('Q','');
    }
    if (piece === ChessPiece.BlackKing) {
      board.castling = board.castling.replace('k','').replace('q','');
    }
    if (piece === ChessPiece.WhiteRook && move.from === 'h1') board.castling = board.castling.replace('K','');
    if (piece === ChessPiece.WhiteRook && move.from === 'a1') board.castling = board.castling.replace('Q','');
    if (piece === ChessPiece.BlackRook && move.from === 'h8') board.castling = board.castling.replace('k','');
    if (piece === ChessPiece.BlackRook && move.from === 'a8') board.castling = board.castling.replace('q','');
    if (move.to === 'a1') board.castling = board.castling.replace('Q','');
    if (move.to === 'h1') board.castling = board.castling.replace('K','');
    if (move.to === 'a8') board.castling = board.castling.replace('q','');
    if (move.to === 'h8') board.castling = board.castling.replace('k','');

    // update en passant target
    board.enPassant = null;
    if (piece.toLowerCase() === 'p') {
      const fromRank = Number(move.from[1]);
      const toRank = Number(move.to[1]);
      if (Math.abs(toRank - fromRank) === 2) {
        const epRank = isWhite ? 3 : 6;
        board.enPassant = `${move.from[0]}${epRank}` as Square;
      }
    }
  }

  async applyMove(move: ChessMove): Promise<void> {
    this.applyMoveTo(this.board, move);
    this.board.activeColor = this.board.activeColor === 'w' ? 'b' : 'w';
    if (move.promotion || this.board.pieces[move.to]?.toLowerCase() === 'p' || this.board.enPassant !== null) {
      this.board.halfmove = 0;
    } else {
      this.board.halfmove += 1;
    }
    if (this.board.activeColor === 'w') this.board.fullmove += 1;
    this.state.custom = { ...this.state.custom, board: boardStateToFen(this.board) } as any;
  }

  async train(dataset: ChessGame[]): Promise<void> {
    const rate = 0.01;
    for (const game of dataset) {
      const sign = game.result === '1-0' ? 1 : game.result === '0-1' ? -1 : 0;
      if (sign === 0) continue;
      const board = JSON.parse(JSON.stringify(game.initial)) as BoardState;
      for (const move of game.moves) {
        const piece = board.pieces[move.from];
        if (!piece) continue;
        const isWhite = piece === piece.toUpperCase();
        const modifier = rate * sign * (isWhite ? 1 : -1);
        this.evalTable[piece as ChessPiece] += modifier;
        this.applyMoveTo(board, move);
      }
    }
    this.state.custom = { ...this.state.custom, evalTable: { ...this.evalTable } } as any;
  }
}

/**
 * Create a chess-engine instance with the specified options
 */
export function createChessEngine(options: ChessEngineOptions = {}): ChessEngineInterface {
  return new ChessEngineImplementation(options);
}

/**
 * Create and initialize a chess-engine instance in a single step
 */
export async function createAndInitializeChessEngine(options: ChessEngineOptions = {}): Promise<ChessEngineInterface> {
  const instance = createChessEngine(options);
  const result = await instance.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize chess-engine: ${result.error}`);
  }
  
  return instance;
}

// Export types
export * from './types';
