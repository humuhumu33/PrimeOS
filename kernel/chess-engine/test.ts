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
  });
});
