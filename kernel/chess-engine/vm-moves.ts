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

/** Generate pseudo-legal moves in plain JS (sliding pieces, promotions,
 * en passant and castling). This helper mirrors the engine's move
 * generation logic but is only used to build the VM program output. */
function pseudoLegalMoves(board: BoardState): ChessMove[] {
  const moves: ChessMove[] = [];
  const files = ['a','b','c','d','e','f','g','h'] as const;

  const addMove = (from: Square, f: number, r: number, promotion?: ChessPiece) => {
    if (f < 0 || f > 7 || r < 1 || r > 8) return;
    const to = `${files[f]}${r}` as Square;
    const target = board.pieces[to];
    const piece = board.pieces[from]!;
    const isWhite = piece === piece.toUpperCase();
    if (target && (target === target.toUpperCase()) === isWhite) return;
    if (promotion) {
      moves.push({ from, to, promotion });
    } else {
      moves.push({ from, to });
    }
  };

  for (const [sq, piece] of Object.entries(board.pieces) as [Square, ChessPiece][]) {
    if (!piece) continue;
    const isWhite = piece === piece.toUpperCase();
    if ((board.activeColor === 'w') !== isWhite) continue;
    const file = files.indexOf(sq[0] as any);
    const rank = Number(sq[1]);

    switch (piece) {
      case ChessPiece.WhitePawn:
      case ChessPiece.BlackPawn: {
        const dir = isWhite ? 1 : -1;
        const startRank = isWhite ? 2 : 7;
        const nextRank = rank + dir;
        if (!board.pieces[`${files[file]}${nextRank}` as Square]) {
          if ((isWhite && nextRank === 8) || (!isWhite && nextRank === 1)) {
            const promos = isWhite ?
              [ChessPiece.WhiteQueen, ChessPiece.WhiteRook, ChessPiece.WhiteBishop, ChessPiece.WhiteKnight] :
              [ChessPiece.BlackQueen, ChessPiece.BlackRook, ChessPiece.BlackBishop, ChessPiece.BlackKnight];
            for (const p of promos) addMove(sq, file, nextRank, p);
          } else {
            addMove(sq, file, nextRank);
          }
          if (rank === startRank && !board.pieces[`${files[file]}${rank + dir*2}` as Square]) {
            addMove(sq, file, rank + dir*2);
          }
        }
        for (const df of [-1,1]) {
          const f = file + df;
          const targetSq = `${files[f]}${nextRank}` as Square;
          const target = board.pieces[targetSq];
          if (f < 0 || f > 7) continue;
          if (target && (target === target.toUpperCase()) !== isWhite) {
            if ((isWhite && nextRank === 8) || (!isWhite && nextRank === 1)) {
              const promos = isWhite ?
                [ChessPiece.WhiteQueen, ChessPiece.WhiteRook, ChessPiece.WhiteBishop, ChessPiece.WhiteKnight] :
                [ChessPiece.BlackQueen, ChessPiece.BlackRook, ChessPiece.BlackBishop, ChessPiece.BlackKnight];
              for (const p of promos) addMove(sq, f, nextRank, p);
            } else {
              addMove(sq, f, nextRank);
            }
          }
        }
        if (board.enPassant) {
          const epFile = files.indexOf(board.enPassant[0] as any);
          const epRank = Number(board.enPassant[1]);
          if (epRank === nextRank && Math.abs(epFile - file) === 1) {
            addMove(sq, epFile, epRank);
          }
        }
        break;
      }
      case ChessPiece.WhiteKnight:
      case ChessPiece.BlackKnight: {
        const offs = [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]];
        for (const [dx,dy] of offs) addMove(sq, file+dx, rank+dy);
        break;
      }
      case ChessPiece.WhiteBishop:
      case ChessPiece.BlackBishop: {
        const dirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
        for (const [dx,dy] of dirs) {
          let f = file + dx;
          let r = rank + dy;
          while (f >= 0 && f < 8 && r >= 1 && r <= 8) {
            const target = board.pieces[`${files[f]}${r}` as Square];
            if (target && (target === target.toUpperCase()) === isWhite) break;
            addMove(sq, f, r);
            if (target) break;
            f += dx; r += dy;
          }
        }
        break;
      }
      case ChessPiece.WhiteRook:
      case ChessPiece.BlackRook: {
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const [dx,dy] of dirs) {
          let f = file + dx;
          let r = rank + dy;
          while (f >= 0 && f < 8 && r >= 1 && r <= 8) {
            const target = board.pieces[`${files[f]}${r}` as Square];
            if (target && (target === target.toUpperCase()) === isWhite) break;
            addMove(sq, f, r);
            if (target) break;
            f += dx; r += dy;
          }
        }
        break;
      }
      case ChessPiece.WhiteQueen:
      case ChessPiece.BlackQueen: {
        const dirs = [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
        for (const [dx,dy] of dirs) {
          let f = file + dx;
          let r = rank + dy;
          while (f >= 0 && f < 8 && r >= 1 && r <= 8) {
            const target = board.pieces[`${files[f]}${r}` as Square];
            if (target && (target === target.toUpperCase()) === isWhite) break;
            addMove(sq, f, r);
            if (target) break;
            f += dx; r += dy;
          }
        }
        break;
      }
      case ChessPiece.WhiteKing:
      case ChessPiece.BlackKing: {
        const dirs = [[1,1],[1,0],[1,-1],[0,1],[0,-1],[-1,1],[-1,0],[-1,-1]];
        for (const [dx,dy] of dirs) addMove(sq, file+dx, rank+dy);

        // castling
        if (piece === ChessPiece.WhiteKing && sq === 'e1') {
          if (board.castling.includes('K') && !board.pieces['f1'] && !board.pieces['g1']) {
            moves.push({ from: 'e1', to: 'g1' });
          }
          if (board.castling.includes('Q') && !board.pieces['d1'] && !board.pieces['c1'] && !board.pieces['b1']) {
            moves.push({ from: 'e1', to: 'c1' });
          }
        }
        if (piece === ChessPiece.BlackKing && sq === 'e8') {
          if (board.castling.includes('k') && !board.pieces['f8'] && !board.pieces['g8']) {
            moves.push({ from: 'e8', to: 'g8' });
          }
          if (board.castling.includes('q') && !board.pieces['d8'] && !board.pieces['c8'] && !board.pieces['b8']) {
            moves.push({ from: 'e8', to: 'c8' });
          }
        }
        break;
      }
    }
  }

  return moves;
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

  // encode move list into memory starting at 200
  const moves = pseudoLegalMoves(board);
  const text = moves.map(m => {
    let t = `${m.from}${m.to}`;
    if (m.promotion) t += m.promotion;
    return t + ' ';
  }).join('');
  let addr = 200;
  for (const ch of text) {
    program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: StandardOpcodes.OP_PUSH, operand: ch.charCodeAt(0) } });
    program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_STORE, operand: addr } });
    addr++;
  }
  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: StandardOpcodes.OP_PUSH, operand: addr - 200 } });
  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_STORE, operand: 199 } });

  // output loop
  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: StandardOpcodes.OP_PUSH, operand: 0 } });
  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_STORE, operand: 198 } });
  const loopStart = program.length;
  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_LOAD, operand: 198 } });
  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_LOAD, operand: 199 } });
  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_LT } });
  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_JIF, operand: 0 } });
  const endJump = program.length - 1;

  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_LOAD, operand: 198 } });
  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: StandardOpcodes.OP_PUSH, operand: 200 } });
  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_ADD } });
  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_LOAD } });
  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: StandardOpcodes.OP_PRINT } });
  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_LOAD, operand: 198 } });
  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: StandardOpcodes.OP_PUSH, operand: 1 } });
  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: StandardOpcodes.OP_ADD } });
  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_STORE, operand: 198 } });
  program.push({ type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_JMP, operand: loopStart } });

  const loopEnd = program.length;
  program[endJump].data.operand = loopEnd;

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
    const promotion = token.length >= 5 ? token[4] as ChessPiece : undefined;
    moves.push(promotion ? { from, to, promotion } : { from, to });
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
