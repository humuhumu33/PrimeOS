/**
 * chess-engine Tests
 * ============
 * 
 * Test suite for the chess-engine module.
 */

import {
  createChessEngine,
  ChessEngineInterface
} from './index';
import { ModelLifecycleState } from '../os/model';
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
  });
});
