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
    const ranks = [1,2,3,4,5,6,7,8];
    const dirs = board.activeColor === 'w' ? 1 : -1;
    const opponent = board.activeColor === 'w' ? /[prnbqk]/ : /[PRNBQK]/;

    for (const f of files) {
      for (const r of ranks) {
        const sq = `${f}${r}` as Square;
        const piece = board.pieces[sq];
        if (!piece) continue;
        const isWhite = piece === piece.toUpperCase();
        if (board.activeColor === 'w' && !isWhite) continue;
        if (board.activeColor === 'b' && isWhite) continue;

        if (piece.toLowerCase() === 'p') {
          const nextRank = r + dirs as any;
          const forward = `${f}${nextRank}` as Square;
          if (!board.pieces[forward]) {
            moves.push({ from: sq, to: forward });
            const startRank = board.activeColor === 'w' ? 2 : 7;
            if (r === startRank) {
              const double = `${f}${r + 2 * dirs}` as Square;
              if (!board.pieces[double]) {
                moves.push({ from: sq, to: double });
              }
            }
          }
          const captureFiles = [files[files.indexOf(f)-1], files[files.indexOf(f)+1]];
          for (const cf of captureFiles) {
            if (!cf) continue;
            const target = `${cf}${nextRank}` as Square;
            if (board.pieces[target] && opponent.test(board.pieces[target]!)) {
              moves.push({ from: sq, to: target });
            }
          }
        }

        if (piece.toLowerCase() === 'n') {
          const offsets = [
            [1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]
          ];
          for (const [df, dr] of offsets) {
            const fi = files.indexOf(f) + df;
            const rr = r + dr;
            if (fi <0 || fi>7 || rr<1 || rr>8) continue;
            const nsq = `${files[fi]}${rr}` as Square;
            const targetPiece = board.pieces[nsq];
            if (!targetPiece || opponent.test(targetPiece)) {
              moves.push({ from: sq, to: nsq });
            }
          }
        }
      }
    }

    moves.sort((a,b)=>{
      const sa = `${a.from}${a.to}`;
      const sb = `${b.from}${b.to}`;
      return sa.localeCompare(sb);
    });
    return moves;
  }

  private movesProgram(board: BoardState): { program: any[]; moves: ChessMove[] } {
    const moves = this.generateMoves(board);
    const chunks: any[] = [];
    for (const m of moves) {
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

    if (moves.length === 0) return null;

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
    delete board.pieces[move.from];
    board.pieces[move.to] = move.promotion ?? piece;
  }

  async applyMove(move: ChessMove): Promise<void> {
    this.applyMoveTo(this.board, move);
    this.board.activeColor = this.board.activeColor === 'w' ? 'b' : 'w';
    this.state.custom = { ...this.state.custom, board: boardStateToFen(this.board) } as any;
  }

  async train(dataset: ChessGame[]): Promise<void> {
    for (const game of dataset) {
      if (game.result === '1/2-1/2') continue;
      const modifier = game.result === '1-0' ? 0.1 : -0.1;
      for (const piece of Object.values(this.evalTable)) {
        // numeric keys not allowed; but we only update via enumeration later
      }
      for (const key of Object.keys(this.evalTable) as Array<ChessPiece>) {
        this.evalTable[key] += modifier;
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
