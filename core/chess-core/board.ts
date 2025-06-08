import { BoardState, ChessPiece, Square } from './types';
import {
  getPrimeRegistry,
  getMappings,
  initializePrimeMappings,
  getHalfmovePrime,
  getFullmovePrime,
} from './primes';

/** Ensure that prime mappings are initialized */
async function ensureInitialized(): Promise<void> {
  try {
    getMappings();
  } catch {
    await initializePrimeMappings();
  }
}

/**
 * Encode a board state into a bigint using prime multiplication.
 */
export async function encodeBoard(state: BoardState): Promise<bigint> {
  await ensureInitialized();
  const { pieceSquare, activeColor, castling, enPassant } = getMappings();
  let value = 1n;
  for (const [square, piece] of Object.entries(state.pieces)) {
    if (!piece) continue;
    value *= pieceSquare[piece as ChessPiece][square as Square];
  }
  value *= activeColor[state.activeColor];
  if (state.castling && state.castling !== '-') {
    for (const flag of state.castling.split('') as ('K'|'Q'|'k'|'q')[]) {
      value *= castling[flag];
    }
  }
  if (state.enPassant) {
    value *= enPassant[state.enPassant];
  }
  value *= getHalfmovePrime(state.halfmove);
  value *= getFullmovePrime(state.fullmove);
  return value;
}

/**
 * Decode a bigint back into a board state by prime factorization.
 */
export async function decodeBoard(encoded: bigint): Promise<BoardState> {
  await ensureInitialized();
  const registry = getPrimeRegistry();
  const { primeLookup } = getMappings();
  const factors = registry.factor(encoded);

  const pieces: Partial<Record<Square, ChessPiece>> = {};
  let activeColor: 'w' | 'b' = 'w';
  const castlingSet = new Set<'K' | 'Q' | 'k' | 'q'>();
  let enPassant: Square | null = null;
  let halfmove = 0;
  let fullmove = 1;

  for (const { prime } of factors) {
    const mapping = primeLookup[prime.toString()];
    if (!mapping) continue;
    if (mapping.piece && mapping.square) {
      pieces[mapping.square] = mapping.piece;
    } else if (mapping.activeColor) {
      activeColor = mapping.activeColor;
    } else if (mapping.castling) {
      castlingSet.add(mapping.castling);
    } else if (mapping.enPassant) {
      enPassant = mapping.enPassant;
    } else if (typeof mapping.halfmove === 'number') {
      halfmove = mapping.halfmove;
    } else if (typeof mapping.fullmove === 'number') {
      fullmove = mapping.fullmove;
    }
  }

  const order = ['K', 'Q', 'k', 'q'] as const;
  const castling = order.filter(c => castlingSet.has(c)).join('') || '-';

  return {
    pieces,
    activeColor,
    castling,
    enPassant,
    halfmove,
    fullmove
  };
}

const FILES = ['a','b','c','d','e','f','g','h'] as const;

/** Convert a FEN string to a BoardState */
export function fenToBoardState(fen: string): BoardState {
  const [placement, active='w', castling='-', ep='-', half='0', full='1'] = fen.trim().split(/\s+/);
  const pieces: Partial<Record<Square, ChessPiece>> = {};
  const rows = placement.split('/');
  for (let r = 0; r < 8; r++) {
    const rankStr = rows[r];
    let fileIdx = 0;
    for (const ch of rankStr) {
      if (/[1-8]/.test(ch)) {
        fileIdx += parseInt(ch, 10);
      } else {
        const square = `${FILES[fileIdx]}${8 - r}` as Square;
        pieces[square] = ch as ChessPiece;
        fileIdx += 1;
      }
    }
  }
  return {
    pieces,
    activeColor: active as 'w' | 'b',
    castling,
    enPassant: ep === '-' ? null : ep as Square,
    halfmove: parseInt(half, 10),
    fullmove: parseInt(full, 10)
  };
}

/** Convert a BoardState back into a FEN string */
export function boardStateToFen(state: BoardState): string {
  const rows: string[] = [];
  for (let r = 7; r >= 0; r--) {
    let empty = 0;
    let row = '';
    for (let f = 0; f < 8; f++) {
      const square = `${FILES[f]}${r+1}` as Square;
      const piece = state.pieces[square];
      if (!piece) {
        empty++;
      } else {
        if (empty > 0) { row += String(empty); empty = 0; }
        row += piece;
      }
    }
    if (empty > 0) row += String(empty);
    rows.push(row);
  }

  const placement = rows.join('/');
  const active = state.activeColor;
  const castling = state.castling || '-';
  const ep = state.enPassant || '-';
  const half = state.halfmove.toString();
  const full = state.fullmove.toString();
  return `${placement} ${active} ${castling} ${ep} ${half} ${full}`;
}
