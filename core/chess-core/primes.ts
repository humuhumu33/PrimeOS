import { createAndInitializePrimeRegistry, PrimeRegistryInterface } from '../prime';
import { ChessPiece, Square } from './types';

export interface PrimeLookupEntry {
  piece?: ChessPiece;
  square?: Square;
  activeColor?: 'w' | 'b';
  castling?: 'K' | 'Q' | 'k' | 'q';
  enPassant?: Square;
  halfmove?: number;
  fullmove?: number;
}

export interface PrimeMappings {
  pieceSquare: Record<ChessPiece, Record<Square, bigint>>;
  activeColor: Record<'w' | 'b', bigint>;
  castling: Record<'K' | 'Q' | 'k' | 'q', bigint>;
  enPassant: Record<Square, bigint>;
  halfmove: Record<number, bigint>;
  fullmove: Record<number, bigint>;
  primeLookup: Record<string, PrimeLookupEntry>;
}

let registry: PrimeRegistryInterface | null = null;
let mappings: PrimeMappings | null = null;
let initialized = false;
let nextIndex = 0;

export async function initializePrimeMappings(): Promise<void> {
  if (initialized) return;
  registry = await createAndInitializePrimeRegistry({ preloadCount: 1000 });
  const pieceSquare: Record<ChessPiece, Record<Square, bigint>> = {} as any;
  const activeColor: Record<'w' | 'b', bigint> = {} as any;
  const castling: Record<'K' | 'Q' | 'k' | 'q', bigint> = {} as any;
  const enPassant: Record<Square, bigint> = {} as any;
  const halfmove: Record<number, bigint> = {};
  const fullmove: Record<number, bigint> = {};
  const primeLookup: Record<string, PrimeLookupEntry> = {};

  const files = ['a','b','c','d','e','f','g','h'] as const;
  const ranks = [1,2,3,4,5,6,7,8] as const;
  let index = 0;

  for (const piece of Object.values(ChessPiece)) {
    pieceSquare[piece] = {} as Record<Square, bigint>;
    for (const r of ranks) {
      for (const f of files) {
        const sq = `${f}${r}` as Square;
        const prime = registry.getPrime(index++);
        pieceSquare[piece][sq] = prime;
        primeLookup[prime.toString()] = { piece, square: sq };
      }
    }
  }

  // active color primes
  for (const color of ['w', 'b'] as const) {
    const prime = registry.getPrime(index++);
    activeColor[color] = prime;
    primeLookup[prime.toString()] = { activeColor: color };
  }

  // castling rights primes (KQkq)
  for (const flag of ['K', 'Q', 'k', 'q'] as const) {
    const prime = registry.getPrime(index++);
    castling[flag] = prime;
    primeLookup[prime.toString()] = { castling: flag };
  }

  // en passant target squares (a3-h3 and a6-h6)
  for (const rank of [3, 6] as const) {
    for (const file of files) {
      const sq = `${file}${rank}` as Square;
      const prime = registry.getPrime(index++);
      enPassant[sq] = prime;
      primeLookup[prime.toString()] = { enPassant: sq };
    }
  }

  nextIndex = index;
  mappings = { pieceSquare, activeColor, castling, enPassant, halfmove, fullmove, primeLookup };
  initialized = true;
}

export function getPrimeRegistry(): PrimeRegistryInterface {
  if (!registry) throw new Error('Prime mappings not initialized');
  return registry;
}

export function getMappings(): PrimeMappings {
  if (!mappings) throw new Error('Prime mappings not initialized');
  return mappings;
}

export function getHalfmovePrime(value: number): bigint {
  if (!mappings) throw new Error('Prime mappings not initialized');
  if (!(value in mappings.halfmove)) {
    const prime = registry!.getPrime(nextIndex++);
    mappings.halfmove[value] = prime;
    mappings.primeLookup[prime.toString()] = { halfmove: value };
  }
  return mappings.halfmove[value];
}

export function getFullmovePrime(value: number): bigint {
  if (!mappings) throw new Error('Prime mappings not initialized');
  if (!(value in mappings.fullmove)) {
    const prime = registry!.getPrime(nextIndex++);
    mappings.fullmove[value] = prime;
    mappings.primeLookup[prime.toString()] = { fullmove: value };
  }
  return mappings.fullmove[value];
}
