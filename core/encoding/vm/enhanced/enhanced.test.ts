import { ExtendedOpcodes } from './opcodes';
import { binaryOperation, unaryOperation, calculateMemoryUsage } from './utils';
import { EnhancedChunkVM } from './index';
import { DecodedChunk, ChunkType, StandardOpcodes } from '../core/types';

describe('enhanced VM utilities', () => {
  test('binaryOperation adds values', () => {
    const stack = [2, 3];
    binaryOperation(stack, (a, b) => a + b, 'ADD');
    expect(stack).toEqual([5]);
  });

  test('unaryOperation negates', () => {
    const stack = [1];
    unaryOperation(stack, a => -a, 'NEG');
    expect(stack).toEqual([-1]);
  });

  test('calculateMemoryUsage returns size', () => {
    const usage = calculateMemoryUsage([], {}, []);
    expect(typeof usage).toBe('number');
    expect(usage).toBeGreaterThan(0);
  });
});

describe('EnhancedChunkVM execution', () => {
  test('executes simple multiply program', () => {
    const vm = new EnhancedChunkVM();
    const program: DecodedChunk[] = [
      { type: ChunkType.OPERATION, checksum: 0n, data: { opcode: StandardOpcodes.OP_PUSH, operand: 2 } },
      { type: ChunkType.OPERATION, checksum: 0n, data: { opcode: StandardOpcodes.OP_PUSH, operand: 3 } },
      { type: ChunkType.OPERATION, checksum: 0n, data: { opcode: ExtendedOpcodes.OP_MUL } },
      { type: ChunkType.OPERATION, checksum: 0n, data: { opcode: StandardOpcodes.OP_PRINT } }
    ];
    const output = vm.execute(program);
    expect(output).toEqual(['6']);
  });
});
