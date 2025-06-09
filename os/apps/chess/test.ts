/**
 * chess Tests
 * =====
 * 
 * Test suite for the chess module.
 */

import {
  createChess,
  ChessInterface,
  ChessOptions,
  ChessState
} from './index';
import { fenToBoardState } from '../../core/chess-core/board';
import { ModelLifecycleState } from '../../model';

describe('chess', () => {
  let instance: ChessInterface;
  
  beforeEach(async () => {
    // Create a fresh instance before each test
    instance = createChess({
      debug: true,
      name: 'test-chess'
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
  
  describe('Basic functionality', () => {
    test('should process input data', async () => {
      const testInput = 'test-data';
      const result = await instance.process(testInput);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
    
    test('should access logger', () => {
      const logger = instance.getLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });
    
    test('should handle custom state', async () => {
      const state = instance.getState();
      expect(state.custom).toBeDefined();
      
      // Add assertions specific to module's custom state
    });
  });
  
  describe('Configuration options', () => {
    test('should use default options when none provided', async () => {
      const defaultInstance = createChess();
      await defaultInstance.initialize();
      
      expect(defaultInstance).toBeDefined();
      
      await defaultInstance.terminate();
    });
    
    test('should respect custom options', async () => {
      const customOptions: ChessOptions = {
        debug: true,
        name: 'custom-chess',
        version: '1.2.3',
        // Add more custom options as needed
      };
      
      const customInstance = createChess(customOptions);
      await customInstance.initialize();
      
      // Process something to get a result with source
      const result = await customInstance.process('test');
      expect(result.source).toContain('custom-chess');
      expect(result.source).toContain('1.2.3');
      
      await customInstance.terminate();
    });
  });
  
  describe('Error handling', () => {
    test('should handle processing errors gracefully', async () => {
      // Create a bad input that will cause an error
      // This is just a placeholder - you may need to adjust for your specific module
      const badInput = undefined;
      
      // Process should not throw but return error result
      const result = await instance.process(badInput as any);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  
  // Template placeholder: Add more test suites specific to the module
  describe('Module-specific functionality', () => {
    test('should implement module-specific features', () => {
      // This is a placeholder for module-specific tests
      // Replace with actual tests for the module's features
      expect(true).toBe(true);
    });

    test('play announces checkmate and stalemate', async () => {
      const impl: any = instance;
      await impl.engine.loadPosition(fenToBoardState('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPP2PP/RNBQKBNR w KQkq - 1 3'));
      const logs: string[] = [];
      const orig = console.log;
      console.log = (msg: string) => { logs.push(msg); };
      await instance.play();
      console.log = orig;
      expect(logs[logs.length - 1]).toBe('Checkmate!');

      await impl.engine.loadPosition(fenToBoardState('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'));
      const logs2: string[] = [];
      console.log = (msg: string) => { logs2.push(msg); };
      await instance.play();
      console.log = orig;
      expect(logs2[logs2.length - 1]).toBe('Stalemate!');
    });
  });
});
