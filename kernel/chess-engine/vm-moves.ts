import { BoardState, ChessMove, ChessPiece, Square } from '../core/chess-core/types';
import { ChunkType } from '../core/encoding/core/types';
import { ExtendedOpcodes, StandardOpcodes } from '../core/encoding/vm/vm-enhanced';

/**
 * Helper to convert board pieces to numeric codes for the VM.
 */
function pieceCode(p?: ChessPiece): number {
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
    [ChessPiece.BlackKing]: 12,
  };
  return table[p];
}

export function createMoveGenerationProgram(board: BoardState) {
  const program: any[] = [];
  // initialize board memory
  const files = ['a','b','c','d','e','f','g','h'] as const;
  const ranks = [1,2,3,4,5,6,7,8] as const;
  let idx = 0;
  for (const r of ranks) {
    for (const f of files) {
      const sq = `${f}${r}` as Square;
      program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: StandardOpcodes.OP_PUSH, operand: pieceCode(board.pieces[sq]) } });
      program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_STORE, operand: idx } });
      idx++;
    }
  }

  // TODO: actual move generation logic using loops and memory access
  // For now just halt
  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_HALT } });
  return program;
}

export function decodeMoveOutput(out: string[]): ChessMove[] {
  const moves: ChessMove[] = [];
  const text = out.join('');
  for (const token of text.trim().split(/\s+/)) {
    if (token.length < 4) continue;
    const from = token.slice(0,2) as Square;
    const to = token.slice(2,4) as Square;
    moves.push({ from, to });
  }
  return moves;
}
