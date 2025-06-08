import { initializePrimeMappings, getMappings } from './primes';
import { fenToBoardState, boardStateToFen, encodeBoard, decodeBoard } from './board';
import { ChessPiece } from './types';

describe('board encoding', () => {
  beforeAll(async () => {
    await initializePrimeMappings();
  });

  test('deterministic prime mapping', () => {
    const { pieceSquare, primeLookup } = getMappings();
    const prime = pieceSquare[ChessPiece.WhitePawn]['a2'];
    const mapping = primeLookup[prime.toString()];
    expect(mapping.piece).toBe(ChessPiece.WhitePawn);
    expect(mapping.square).toBe('a2');
  });

  test('round-trip encode/decode', async () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq e3 0 1';
    const state = fenToBoardState(fen);
    const encoded = await encodeBoard(state);
    const decoded = await decodeBoard(encoded);
    const fen2 = boardStateToFen(decoded);
    expect(fen2).toBe(fen);
  });
});
