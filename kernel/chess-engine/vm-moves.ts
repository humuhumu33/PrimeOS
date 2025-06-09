import { BoardState, ChessMove, ChessPiece, Square } from '../core/chess-core/types';
import { ChunkType } from '../core/encoding/core/types';
import { ExtendedOpcodes } from '../core/encoding/vm/enhanced';
import { StandardOpcodes } from '../core/encoding/core/types';

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

/** Convert square like 'e4' to numeric index 0-63 */
function squareIndex(sq: Square): number {
  const files = ['a','b','c','d','e','f','g','h'] as const;
  const file = files.indexOf(sq[0] as any);
  const rank = parseInt(sq[1], 10);
  return (rank - 1) * 8 + file;
}

/** Build a VM program that prints 1 if the given color's king is in check */
export function createCheckProgram(board: BoardState, color: 'w' | 'b') {
  const program: any[] = [];
  const enemy = color === 'w' ? 'b' : 'w';

  // load board into memory
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

  // find king square
  let kingSq: Square | undefined;
  for (const [sq, piece] of Object.entries(board.pieces)) {
    if (!piece) continue;
    if (color === 'w' && piece === ChessPiece.WhiteKing) kingSq = sq as Square;
    if (color === 'b' && piece === ChessPiece.BlackKing) kingSq = sq as Square;
  }
  if (!kingSq) {
    program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: StandardOpcodes.OP_PUSH, operand: 0 } });
    program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: StandardOpcodes.OP_PRINT } });
    program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_HALT } });
    return program;
  }
  const kIdx = squareIndex(kingSq);

  // helper to add a check for a specific square and piece
  function checkSquare(offset: number, pieces: ChessPiece[]) {
    const target = kIdx + offset;
    if (target < 0 || target >= 64) return;
    program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_LOAD, operand: target } });
    const codes = pieces.map(p => pieceCode(p));
    program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: StandardOpcodes.OP_PUSH, operand: codes[0] } });
    program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_EQ } });
    for (let i = 1; i < codes.length; i++) {
      program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_LOAD, operand: target } });
      program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: StandardOpcodes.OP_PUSH, operand: codes[i] } });
      program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_EQ } });
      program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_OR } });
    }
    program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_OR } });
  }

  // start with false on stack
  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: StandardOpcodes.OP_PUSH, operand: 0 } });

  const pawnOffsets = color === 'w' ? [-9, -7] : [7, 9];
  for (const off of pawnOffsets) {
    checkSquare(off, [enemy === 'w' ? ChessPiece.WhitePawn : ChessPiece.BlackPawn]);
  }

  const knightOffsets = [-17,-15,-10,-6,6,10,15,17];
  for (const off of knightOffsets) {
    checkSquare(off, [enemy === 'w' ? ChessPiece.WhiteKnight : ChessPiece.BlackKnight]);
  }

  const kingOffsets = [-9,-8,-7,-1,1,7,8,9];
  for (const off of kingOffsets) {
    checkSquare(off, [enemy === 'w' ? ChessPiece.WhiteKing : ChessPiece.BlackKing]);
  }

  const diagOffsets = [-9,-7,7,9];
  for (const off of diagOffsets) {
    for (let mul = 1; mul < 8; mul++) {
      checkSquare(off * mul, [enemy === 'w' ? ChessPiece.WhiteBishop : ChessPiece.BlackBishop, enemy === 'w' ? ChessPiece.WhiteQueen : ChessPiece.BlackQueen]);
    }
  }

  const orthoOffsets = [-8,-1,1,8];
  for (const off of orthoOffsets) {
    for (let mul = 1; mul < 8; mul++) {
      checkSquare(off * mul, [enemy === 'w' ? ChessPiece.WhiteRook : ChessPiece.BlackRook, enemy === 'w' ? ChessPiece.WhiteQueen : ChessPiece.BlackQueen]);
    }
  }

  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: StandardOpcodes.OP_PRINT } });
  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_HALT } });
  return program;
}

export function decodeCheckOutput(out: string[]): boolean {
  const text = out.join('').trim();
  return text === '1';
}
