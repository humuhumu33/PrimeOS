import { createAndInitializePrimeRegistry, PrimeRegistryInterface } from '../prime';
import { ChessPiece, Square } from './types';

export interface PrimeMappings {
  pieceSquare: Record<ChessPiece, Record<Square, bigint>>;
  primeLookup: Record<string, { piece: ChessPiece; square: Square }>;
}

let registry: PrimeRegistryInterface | null = null;
let mappings: PrimeMappings | null = null;
let initialized = false;

export async function initializePrimeMappings(): Promise<void> {
  if (initialized) return;
  registry = await createAndInitializePrimeRegistry({ preloadCount: 1000 });
  const pieceSquare: Record<ChessPiece, Record<Square, bigint>> = {} as any;
  const primeLookup: Record<string, { piece: ChessPiece; square: Square }> = {};

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

  mappings = { pieceSquare, primeLookup };
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
