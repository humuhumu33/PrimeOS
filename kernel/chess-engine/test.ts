/**
 * chess-engine Tests
 * ============
 * 
 * Test suite for the chess-engine module.
 */

import {
  createChessEngine,
  ChessEngineInterface,
  ChessPiece,
  ChessGame
} from './index';
import { ModelLifecycleState } from '../../os/model';
import { fenToBoardState } from '../core/chess-core/board';

describe('chess-engine', () => {
  let instance: ChessEngineInterface;
  
  beforeEach(async () => {
    // Create a fresh instance before each test
    instance = createChessEngine({
      debug: true,
      name: 'test-chess-engine'
    });
    
    // Initialize the instance
    await instance.initialize();
  });
  
  afterEach(async () => {
    // Clean up after each test
    await instance.terminate();
  });
  
  describe('Lifecycle Management', () => {
    test('should initialize correctly', () => {
      const state = instance.getState();
      expect(state.lifecycle).toBe(ModelLifecycleState.Ready);
    });
    
    test('should reset state', async () => {
      // Perform some operations
      await instance.process('test-data');
      
      // Reset the instance
      const result = await instance.reset();
      expect(result.success).toBe(true);
      
      // Check state after reset
      const state = instance.getState();
      expect(state.operationCount.total).toBe(0);
    });
    
    test('should terminate properly', async () => {
      const result = await instance.terminate();
      expect(result.success).toBe(true);
      
      const state = instance.getState();
      expect(state.lifecycle).toBe(ModelLifecycleState.Terminated);
    });
  });
  
  describe('Deterministic move computation', () => {
    test('same position yields same move', async () => {
      const start = fenToBoardState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      await instance.loadPosition(start);
      const m1 = await instance.computeMove();
      const m2 = await instance.computeMove();
      expect(m1).toEqual(m2);
    });

    test('move list generation via VM', async () => {
      const start = fenToBoardState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      await instance.loadPosition(start);
      const moves = (instance as any).generateMoves(start);
      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBeGreaterThan(0);
    });

    test('search depth 1 matches computeMove', async () => {
      const start = fenToBoardState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      await instance.loadPosition(start);
      const s = await (instance as any).search(1);
      const c = await instance.computeMove();
      expect(s).toEqual(c);
    });

    test('search depth 2 deterministic', async () => {
      const start = fenToBoardState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      await instance.loadPosition(start);
      const a = await (instance as any).search(2);
      const b = await (instance as any).search(2);
      expect(a).toEqual(b);
    });

    test('search depth 3 deterministic', async () => {
      const start = fenToBoardState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      await instance.loadPosition(start);
      const a = await (instance as any).search(3);
      const b = await (instance as any).search(3);
      expect(a).toEqual(b);
    });
  });

  describe('Piece move generation', () => {
    test('white pawn moves', async () => {
      const board = fenToBoardState('8/8/8/8/8/8/4P3/8 w - - 0 1');
      await instance.loadPosition(board);
      const moves = (instance as any).generateMoves(board);
      expect(moves).toEqual(
        expect.arrayContaining([
          { from: 'e2', to: 'e3' },
          { from: 'e2', to: 'e4' }
        ])
      );
      expect(moves.length).toBe(2);
    });

    test('black pawn moves', async () => {
      const board = fenToBoardState('8/3p4/8/8/8/8/8/8 b - - 0 1');
      await instance.loadPosition(board);
      const moves = (instance as any).generateMoves(board);
      expect(moves).toEqual(
        expect.arrayContaining([
          { from: 'd7', to: 'd6' },
          { from: 'd7', to: 'd5' }
        ])
      );
      expect(moves.length).toBe(2);
    });

    test('knight moves', async () => {
      const board = fenToBoardState('8/8/8/8/3N4/8/8/8 w - - 0 1');
      await instance.loadPosition(board);
      const moves = (instance as any).generateMoves(board);
      const targets = ['b5','b3','c6','c2','e6','e2','f5','f3'];
      for (const t of targets) {
        expect(moves).toContainEqual({ from: 'd4', to: t });
      }
      expect(moves.length).toBe(8);
    });

    test('bishop moves', async () => {
      const board = fenToBoardState('8/8/8/8/3B4/8/8/8 w - - 0 1');
      await instance.loadPosition(board);
      const moves = (instance as any).generateMoves(board);
      const targets = ['c5','b6','a7','e5','f6','g7','h8','c3','b2','a1','e3','f2','g1'];
      for (const t of targets) {
        expect(moves).toContainEqual({ from: 'd4', to: t });
      }
      expect(moves.length).toBe(13);
    });

    test('rook moves', async () => {
      const board = fenToBoardState('8/8/8/8/3R4/8/8/8 w - - 0 1');
      await instance.loadPosition(board);
      const moves = (instance as any).generateMoves(board);
      const targets = ['a4','b4','c4','e4','f4','g4','h4','d1','d2','d3','d5','d6','d7','d8'];
      for (const t of targets) {
        expect(moves).toContainEqual({ from: 'd4', to: t });
      }
      expect(moves.length).toBe(14);
    });

    test('queen moves', async () => {
      const board = fenToBoardState('8/8/8/8/3Q4/8/8/8 w - - 0 1');
      await instance.loadPosition(board);
      const moves = (instance as any).generateMoves(board);
      const targets = [
        'c5','b6','a7','e5','f6','g7','h8','c3','b2','a1','e3','f2','g1',
        'a4','b4','c4','e4','f4','g4','h4','d1','d2','d3','d5','d6','d7','d8'
      ];
      for (const t of targets) {
        expect(moves).toContainEqual({ from: 'd4', to: t });
      }
      expect(moves.length).toBe(27);
    });

    test('king moves', async () => {
      const board = fenToBoardState('8/8/8/8/3K4/8/8/8 w - - 0 1');
      await instance.loadPosition(board);
      const moves = (instance as any).generateMoves(board);
      const targets = ['c5','d5','e5','c4','e4','c3','d3','e3'];
      for (const t of targets) {
        expect(moves).toContainEqual({ from: 'd4', to: t });
      }
      expect(moves.length).toBe(8);
    });

    test('pawn promotion moves', async () => {
      const board = fenToBoardState('8/4P3/8/8/8/8/8/8 w - - 0 1');
      await instance.loadPosition(board);
      const moves = (instance as any).generateMoves(board);
      const promos = [ChessPiece.WhiteQueen, ChessPiece.WhiteRook, ChessPiece.WhiteBishop, ChessPiece.WhiteKnight];
      for (const p of promos) {
        expect(moves).toContainEqual({ from: 'e7', to: 'e8', promotion: p });
      }
      expect(moves.length).toBe(4);
    });

    test('en passant move', async () => {
      const board = fenToBoardState('8/8/8/3pP3/8/8/8/8 w - d6 0 1');
      await instance.loadPosition(board);
      const moves = (instance as any).generateMoves(board);
      expect(moves).toContainEqual({ from: 'e5', to: 'd6' });
    });

    test('castling moves generated', async () => {
      const board = fenToBoardState('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
      await instance.loadPosition(board);
      const moves = (instance as any).generateMoves(board);
      expect(moves).toContainEqual({ from: 'e1', to: 'g1' });
      expect(moves).toContainEqual({ from: 'e1', to: 'c1' });
    });
  });

  describe('Special move handling', () => {
    test('castling moves pieces correctly', async () => {
      const board = fenToBoardState('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
      (instance as any).applyMoveTo(board, { from: 'e1', to: 'g1' });
      expect(board.pieces['f1']).toBe(ChessPiece.WhiteRook);
      expect(board.pieces['h1']).toBeUndefined();
      expect(board.castling.includes('K')).toBe(false);
      expect(board.castling.includes('Q')).toBe(false);
    });

    test('en passant capture removes pawn', async () => {
      const board = fenToBoardState('8/8/8/3pP3/8/8/8/8 w - d6 0 1');
      (instance as any).applyMoveTo(board, { from: 'e5', to: 'd6' });
      expect(board.pieces['d5']).toBeUndefined();
      expect(board.pieces['d6']).toBe(ChessPiece.WhitePawn);
    });

    test('pawn promotion replaces piece', async () => {
      const board = fenToBoardState('8/4P3/8/8/8/8/8/8 w - - 0 1');
      (instance as any).applyMoveTo(board, { from: 'e7', to: 'e8', promotion: ChessPiece.WhiteQueen });
      expect(board.pieces['e8']).toBe(ChessPiece.WhiteQueen);
      expect(board.pieces['e7']).toBeUndefined();
    });
  });

  describe('Training', () => {
    test('weights adjust deterministically', async () => {
      const game: ChessGame = {
        initial: fenToBoardState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
        moves: [
          { from: 'e2', to: 'e4' },
          { from: 'e7', to: 'e5' }
        ],
        result: '1-0'
      };
      const before = instance.getState().custom?.evalTable as Record<ChessPiece, number>;
      const wp = before[ChessPiece.WhitePawn];
      const bp = before[ChessPiece.BlackPawn];
      await instance.train([game]);
      const after = instance.getState().custom?.evalTable as Record<ChessPiece, number>;
      expect(after[ChessPiece.WhitePawn]).toBeCloseTo(wp + 0.01, 5);
      expect(after[ChessPiece.BlackPawn]).toBeCloseTo(bp - 0.01, 5);
    });

    test('piece-square table impacts evaluation', async () => {
      const start = fenToBoardState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      await instance.loadPosition(start);
      const prog1 = (instance as any).evaluationProgram(start);
      const out1 = (instance as any).vm.execute(prog1);
      const val1 = parseInt(out1[out1.length - 1] || '0', 10);
      const idx = (instance as any).squareIndex('e2');
      (instance as any).pieceSquareTables[ChessPiece.WhitePawn][idx] = 3;
      const prog2 = (instance as any).evaluationProgram(start);
      const out2 = (instance as any).vm.execute(prog2);
      const val2 = parseInt(out2[out2.length - 1] || '0', 10);
      expect(val2).toBe(val1 + 3);
    });
  });

  describe('Check and game end detection', () => {
    test('king in check yields only legal moves', async () => {
      const pos = fenToBoardState('4k3/8/8/8/8/8/4Q3/4K3 b - - 0 1');
      await instance.loadPosition(pos);
      const moves = (instance as any).generateMoves(pos);
      for (const m of moves) {
        const copy = JSON.parse(JSON.stringify(pos));
        (instance as any).applyMoveTo(copy, m);
        expect((instance as any).isKingInCheck(copy, 'b')).toBe(false);
      }
    });

    test('isKingInCheck detects threats', async () => {
      const pos = fenToBoardState('4k3/8/8/8/8/8/4Q3/4K3 b - - 0 1');
      expect((instance as any).isKingInCheck(pos, 'b')).toBe(true);
      expect((instance as any).isKingInCheck(pos, 'w')).toBe(false);
    });

    test('detect checkmate', async () => {
      const mate = fenToBoardState('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPP2PP/RNBQKBNR w KQkq - 1 3');
      await instance.loadPosition(mate);
      const res = await instance.computeMove();
      expect(res).toBeNull();
    });

    test('detect stalemate', async () => {
      const stalemate = fenToBoardState('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
      await instance.loadPosition(stalemate);
      const res = await instance.computeMove();
      expect(res).toBeNull();
    });

    test('computeMove escapes check legally', async () => {
      const pos = fenToBoardState('r3k3/8/8/8/8/8/4Q3/4K3 b - - 0 1');
      await instance.loadPosition(pos);
      const move = await instance.computeMove();
      expect(move).not.toBeNull();
      const copy = JSON.parse(JSON.stringify(pos));
      (instance as any).applyMoveTo(copy, move!);
      expect((instance as any).isKingInCheck(copy, 'b')).toBe(false);
    });

    test('illegal castling not generated', async () => {
      const board = fenToBoardState('4k3/8/8/8/8/8/4r3/R3K2R w KQ - 0 1');
      await instance.loadPosition(board);
      const moves = (instance as any).generateMoves(board);
      for (const m of moves) {
        expect(!(m.from === 'e1' && (m.to === 'g1' || m.to === 'c1'))).toBe(true);
      }
    });
  });
});
