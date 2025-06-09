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
import { EnhancedChunkVM, ExtendedOpcodes } from '../core/encoding/vm/enhanced';
import { createMoveGenerationProgram, decodeMoveOutput, createCheckProgram, decodeCheckOutput } from './vm-moves';
import { DEFAULT_PST } from './pst';

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
  private pieceSquareTables: Record<ChessPiece, number[]>;

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
    this.pieceSquareTables = JSON.parse(JSON.stringify(DEFAULT_PST));
  }

  protected async onInitialize(): Promise<void> {
    this.state.custom = {
      board: boardStateToFen(this.board),
      evalTable: { ...this.evalTable },
      pieceSquareTables: JSON.parse(JSON.stringify(this.pieceSquareTables))
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
      evalTable: { ...this.evalTable },
      pieceSquareTables: JSON.parse(JSON.stringify(this.pieceSquareTables))
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

  private squareIndex(sq: Square): number {
    const files = ['a','b','c','d','e','f','g','h'] as const;
    const file = files.indexOf(sq[0] as any);
    const rank = parseInt(sq[1], 10);
    return (rank - 1) * 8 + file;
  }

  private evaluationProgram(board: BoardState): any[] {
    const program: any[] = [];
    program.push({ type: 'operation', opcode: StandardOpcodes.OP_PUSH, operand: 0 });

    const files = ['a','b','c','d','e','f','g','h'] as const;

    // piece value and piece-square tables
    for (const [sq, piece] of Object.entries(board.pieces) as [Square, ChessPiece][]) {
      if (!piece) continue;
      const isWhite = piece === piece.toUpperCase();
      const sign = isWhite ? 1 : -1;
      const base = this.evalTable[piece as ChessPiece];
      const idx = isWhite ? this.squareIndex(sq) : 63 - this.squareIndex(sq);
      const pstVal = this.pieceSquareTables[piece as ChessPiece][idx] || 0;
      const value = (base + pstVal) * sign;
      program.push({ type: 'operation', opcode: StandardOpcodes.OP_PUSH, operand: value });
      program.push({ type: 'operation', opcode: StandardOpcodes.OP_ADD });
    }

    // load board into memory for mobility/king safety loops
    let memIdx = 0;
    for (let r = 1; r <= 8; r++) {
      for (const f of files) {
        const sq = `${f}${r}` as Square;
        const code = (p => {
          if (!p) return 0;
          const table: Record<ChessPiece, number> = {
            [ChessPiece.WhitePawn]: 1,
            [ChessPiece.WhiteKnight]: 2,
            [ChessPiece.WhiteBishop]: 3,
            [ChessPiece.WhiteRook]: 4,
            [ChessPiece.WhiteQueen]: 5,
            [ChessPiece.WhiteKing]: 6,
            [ChessPiece.BlackPawn]: 7,
            [ChessPiece.BlackKnight]: 8,
            [ChessPiece.BlackBishop]: 9,
            [ChessPiece.BlackRook]: 10,
            [ChessPiece.BlackQueen]: 11,
            [ChessPiece.BlackKing]: 12
          };
          return table[p];
        })(board.pieces[sq]);
        program.push({ type: 'operation', opcode: StandardOpcodes.OP_PUSH, operand: code });
        program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_STORE, operand: memIdx });
        memIdx++;
      }
    }

    // mobility accumulator at 100, index at 101
    program.push({ type: 'operation', opcode: StandardOpcodes.OP_PUSH, operand: 0 });
    program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_STORE, operand: 100 });
    program.push({ type: 'operation', opcode: StandardOpcodes.OP_PUSH, operand: 0 });
    program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_STORE, operand: 101 });

    const loopStart = program.length;
    program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_LOAD, operand: 101 });
    program.push({ type: 'operation', opcode: StandardOpcodes.OP_PUSH, operand: 64 });
    program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_LT });
    program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_JIF, operand: 0 }); // patched later
    const jmpOutIdx = program.length - 1;

    // body: if mem[i] != 0 then mobility++
    program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_LOAD, operand: 101 });
    program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_LOAD });
    program.push({ type: 'operation', opcode: StandardOpcodes.OP_PUSH, operand: 0 });
    program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_NEQ });
    program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_JIF, operand: 0 }); // patched skip add
    const skipAddIdx = program.length - 1;

    program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_LOAD, operand: 100 });
    program.push({ type: 'operation', opcode: StandardOpcodes.OP_PUSH, operand: 1 });
    program.push({ type: 'operation', opcode: StandardOpcodes.OP_ADD });
    program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_STORE, operand: 100 });

    const afterAddIdx = program.length;
    program[skipAddIdx].operand = afterAddIdx;

    // i++
    program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_LOAD, operand: 101 });
    program.push({ type: 'operation', opcode: StandardOpcodes.OP_PUSH, operand: 1 });
    program.push({ type: 'operation', opcode: StandardOpcodes.OP_ADD });
    program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_STORE, operand: 101 });
    program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_JMP, operand: loopStart });

    const loopEnd = program.length;
    program[jmpOutIdx].operand = loopEnd;

    // add mobility weight
    program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_LOAD, operand: 100 });
    program.push({ type: 'operation', opcode: StandardOpcodes.OP_PUSH, operand: 1 });
    program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_MUL });
    program.push({ type: 'operation', opcode: StandardOpcodes.OP_ADD });

    // king safety around active king
    const kingSq = ((): Square | null => {
      for (const [s, p] of Object.entries(board.pieces)) {
        if (!p) continue;
        if (board.activeColor === 'w' && p === ChessPiece.WhiteKing) return s as Square;
        if (board.activeColor === 'b' && p === ChessPiece.BlackKing) return s as Square;
      }
      return null;
    })();
    if (kingSq) {
      const kIdx = this.squareIndex(kingSq);
      program.push({ type: 'operation', opcode: StandardOpcodes.OP_PUSH, operand: 0 });
      program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_STORE, operand: 102 });
      const offsets = [-9,-8,-7,-1,1,7,8,9];
      for (const off of offsets) {
        const addr = kIdx + off;
        if (addr < 0 || addr >= 64) continue;
        program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_LOAD, operand: addr });
        if (board.activeColor === 'w') {
          program.push({ type: 'operation', opcode: StandardOpcodes.OP_PUSH, operand: 0 });
          program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_GT });
          program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_LOAD, operand: addr });
          program.push({ type: 'operation', opcode: StandardOpcodes.OP_PUSH, operand: 7 });
          program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_LT });
          program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_AND });
        } else {
          program.push({ type: 'operation', opcode: StandardOpcodes.OP_PUSH, operand: 6 });
          program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_GT });
        }
        program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_JIF, operand: program.length + 4 });
        const addKSIdx = program.length - 1;
        program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_LOAD, operand: 102 });
        program.push({ type: 'operation', opcode: StandardOpcodes.OP_PUSH, operand: 1 });
        program.push({ type: 'operation', opcode: StandardOpcodes.OP_ADD });
        program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_STORE, operand: 102 });
        program[addKSIdx].operand = program.length;
      }
      program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_LOAD, operand: 102 });
      program.push({ type: 'operation', opcode: StandardOpcodes.OP_PUSH, operand: 1 });
      program.push({ type: 'operation', opcode: ExtendedOpcodes.OP_MUL });
      program.push({ type: 'operation', opcode: StandardOpcodes.OP_ADD });
    }

    program.push({ type: 'operation', opcode: StandardOpcodes.OP_PRINT });
    return program.map(op => ({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: op.opcode, operand: op.operand } }));
  }

  private generateMoves(board: BoardState): ChessMove[] {
    return this.movesProgram(board).moves;
  }

  private isKingInCheck(board: BoardState, color: 'w' | 'b'): boolean {
    const prog = createCheckProgram(board, color);
    const out = this.vm.execute(prog as any);
    return decodeCheckOutput(out);
  }

  private movesProgram(board: BoardState): { program: any[]; moves: ChessMove[] } {
    const program = createMoveGenerationProgram(board);
    const raw = decodeMoveOutput(this.vm.execute(program as any));
    const legal: ChessMove[] = [];
    for (const m of raw) {
      // disallow castling through or out of check
      if (
        (m.from === 'e1' && (m.to === 'g1' || m.to === 'c1')) ||
        (m.from === 'e8' && (m.to === 'g8' || m.to === 'c8'))
      ) {
        if (this.isKingInCheck(board, board.activeColor)) continue;
        const mid = m.to === 'g1' ? 'f1' : m.to === 'c1' ? 'd1' : m.to === 'g8' ? 'f8' : 'd8';
        const tempMid = JSON.parse(JSON.stringify(board)) as BoardState;
        this.applyMoveTo(tempMid, { from: m.from, to: mid });
        if (this.isKingInCheck(tempMid, board.activeColor)) continue;
      }
      const copy = JSON.parse(JSON.stringify(board)) as BoardState;
      this.applyMoveTo(copy, m);
      if (!this.isKingInCheck(copy, board.activeColor)) legal.push(m);
    }
    return { program, moves: legal };
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

  async search(depth: number): Promise<ChessMove | null> {
    const maximizing = this.board.activeColor === 'w';

    const minimax = (board: BoardState, d: number, alpha: number, beta: number, max: boolean): { move: ChessMove | null; val: number } => {
      const moves = this.generateMoves(board);
      if (d === 0 || moves.length === 0) {
        if (moves.length === 0) {
          const inCheck = this.isKingInCheck(board, board.activeColor);
          if (inCheck) return { move: null, val: max ? -Infinity : Infinity };
          return { move: null, val: 0 };
        }
        const prog = this.evaluationProgram(board);
        const out = this.vm.execute(prog as any);
        const val = parseInt(out[out.length - 1] || '0', 10);
        return { move: null, val };
      }

      let bestMove: ChessMove | null = null;
      if (max) {
        let bestVal = -Infinity;
        for (const m of moves) {
          const next = JSON.parse(JSON.stringify(board)) as BoardState;
          this.applyMoveTo(next, m);
          next.activeColor = board.activeColor === 'w' ? 'b' : 'w';
          if (m.promotion || next.pieces[m.to]?.toLowerCase() === 'p' || next.enPassant !== null) {
            next.halfmove = 0;
          } else {
            next.halfmove += 1;
          }
          if (next.activeColor === 'w') next.fullmove += 1;
          const res = minimax(next, d - 1, alpha, beta, false);
          if (res.val > bestVal) {
            bestVal = res.val;
            bestMove = m;
          }
          alpha = Math.max(alpha, res.val);
          if (beta <= alpha) break;
        }
        return { move: bestMove, val: bestVal };
      } else {
        let bestVal = Infinity;
        for (const m of moves) {
          const next = JSON.parse(JSON.stringify(board)) as BoardState;
          this.applyMoveTo(next, m);
          next.activeColor = board.activeColor === 'w' ? 'b' : 'w';
          if (m.promotion || next.pieces[m.to]?.toLowerCase() === 'p' || next.enPassant !== null) {
            next.halfmove = 0;
          } else {
            next.halfmove += 1;
          }
          if (next.activeColor === 'w') next.fullmove += 1;
          const res = minimax(next, d - 1, alpha, beta, true);
          if (res.val < bestVal) {
            bestVal = res.val;
            bestMove = m;
          }
          beta = Math.min(beta, res.val);
          if (beta <= alpha) break;
        }
        return { move: bestMove, val: bestVal };
      }
    };

    return minimax(this.board, depth, -Infinity, Infinity, maximizing).move;
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
        const fromIdx = isWhite ? this.squareIndex(move.from) : 63 - this.squareIndex(move.from);
        const toIdx = isWhite ? this.squareIndex(move.to) : 63 - this.squareIndex(move.to);
        this.pieceSquareTables[piece as ChessPiece][fromIdx] -= modifier;
        this.pieceSquareTables[piece as ChessPiece][toIdx] += modifier;
        this.applyMoveTo(board, move);
      }
    }
    this.state.custom = {
      ...this.state.custom,
      evalTable: { ...this.evalTable },
      pieceSquareTables: JSON.parse(JSON.stringify(this.pieceSquareTables))
    } as any;
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
