import { DecodedChunk, ChunkType, StandardOpcodes, VMExecutionError, AdvancedVMExecutionResult } from '../core/types';
import { ExtendedOpcodes, VMMemory, CallFrame } from './opcodes';
import { binaryOperation, unaryOperation, calculateMemoryUsage } from './utils';

export class EnhancedChunkVM {
  private stack: any[] = [];
  private memory: VMMemory = {};
  private callStack: CallFrame[] = [];
  private output: string[] = [];
  private input: string[] = [];
  private programCounter = 0;
  private operations = 0;
  private executionTime = 0;
  private memoryUsed = 0;
  private instructionsExecuted = 0;
  private errors: string[] = [];
  private warnings: string[] = [];
  private halted = false;
  private debugMode = false;

  constructor(debugMode = false) {
    this.debugMode = debugMode;
  }

  reset(): void {
    this.stack = [];
    this.memory = {};
    this.callStack = [];
    this.output = [];
    this.input = [];
    this.programCounter = 0;
    this.operations = 0;
    this.executionTime = 0;
    this.memoryUsed = 0;
    this.instructionsExecuted = 0;
    this.errors = [];
    this.warnings = [];
    this.halted = false;
  }

  setInput(input: string[]): void {
    this.input = [...input];
  }

  execute(chunks: DecodedChunk[]): string[] {
    const startTime = performance.now();
    this.reset();

    const instructions = this.chunksToInstructions(chunks);

    try {
      while (this.programCounter < instructions.length && !this.halted) {
        this.executeInstruction(instructions[this.programCounter]);
        this.programCounter++;
        this.instructionsExecuted++;

        if (this.instructionsExecuted > 1000000) {
          throw new VMExecutionError('SAFETY', 'Maximum instruction limit exceeded');
        }
      }
    } catch (error) {
      if (error instanceof VMExecutionError) {
        this.errors.push(error.message);
        throw error;
      }
      this.errors.push(error instanceof Error ? error.message : 'Unknown error');
      throw new VMExecutionError('RUNTIME', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.executionTime = performance.now() - startTime;
      this.memoryUsed = calculateMemoryUsage(this.stack, this.memory, this.callStack);
    }

    return [...this.output];
  }

  private chunksToInstructions(chunks: DecodedChunk[]): any[] {
    const instructions: any[] = [];

    for (const chunk of chunks) {
      switch (chunk.type) {
        case ChunkType.OPERATION:
          instructions.push({ type: 'operation', opcode: chunk.data.opcode, operand: chunk.data.operand });
          break;
        case ChunkType.DATA:
          instructions.push({ type: 'data', position: chunk.data.position, value: chunk.data.value });
          break;
        case ChunkType.BLOCK_HEADER:
          instructions.push({ type: 'block', blockType: chunk.data.blockType, blockLength: chunk.data.blockLength });
          break;
        default:
          break;
      }
    }

    return instructions;
  }

  private executeInstruction(instruction: any): void {
    this.operations++;

    if (this.debugMode) {
      this.output.push(`DEBUG: PC=${this.programCounter}, OP=${instruction.type}, STACK=[${this.stack.join(',')}]`);
    }

    switch (instruction.type) {
      case 'operation':
        this.executeOperation(instruction.opcode, instruction.operand);
        break;
      case 'data':
        this.executeData(instruction.value);
        break;
      case 'block':
        this.executeBlock(instruction.blockType, instruction.blockLength);
        break;
      default:
        this.warnings.push(`Unknown instruction type: ${instruction.type}`);
        break;
    }
  }

  private executeOperation(opcode: number, operand?: number): void {
    switch (opcode) {
      case StandardOpcodes.OP_PUSH:
        if (operand === undefined) {
          throw new VMExecutionError('PUSH', 'Missing operand for PUSH operation');
        }
        this.stack.push(operand);
        break;

      case StandardOpcodes.OP_ADD:
        binaryOperation(this.stack, (a, b) => a + b, 'ADD');
        break;

      case StandardOpcodes.OP_PRINT:
        if (this.stack.length < 1) {
          throw new VMExecutionError('PRINT', 'Stack underflow: PRINT requires 1 operand');
        }
        this.output.push(this.stack.pop()!.toString());
        break;

      case ExtendedOpcodes.OP_SUB:
        binaryOperation(this.stack, (a, b) => a - b, 'SUB');
        break;
      case ExtendedOpcodes.OP_MUL:
        binaryOperation(this.stack, (a, b) => a * b, 'MUL');
        break;
      case ExtendedOpcodes.OP_DIV:
        binaryOperation(this.stack, (a, b) => { if (b === 0) throw new VMExecutionError('DIV', 'Division by zero'); return Math.floor(a / b); }, 'DIV');
        break;
      case ExtendedOpcodes.OP_MOD:
        binaryOperation(this.stack, (a, b) => { if (b === 0) throw new VMExecutionError('MOD', 'Modulo by zero'); return a % b; }, 'MOD');
        break;
      case ExtendedOpcodes.OP_POW:
        binaryOperation(this.stack, (a, b) => Math.pow(a, b), 'POW');
        break;

      case ExtendedOpcodes.OP_DUP:
        if (this.stack.length < 1) {
          throw new VMExecutionError('DUP', 'Stack underflow: DUP requires 1 operand');
        }
        this.stack.push(this.stack[this.stack.length - 1]);
        break;
      case ExtendedOpcodes.OP_SWAP:
        if (this.stack.length < 2) {
          throw new VMExecutionError('SWAP', 'Stack underflow: SWAP requires 2 operands');
        }
        const a = this.stack.pop()!;
        const b = this.stack.pop()!;
        this.stack.push(a);
        this.stack.push(b);
        break;
      case ExtendedOpcodes.OP_POP:
        if (this.stack.length < 1) {
          throw new VMExecutionError('POP', 'Stack underflow: POP requires 1 operand');
        }
        this.stack.pop();
        break;
      case ExtendedOpcodes.OP_CLEAR:
        this.stack = [];
        break;

      case ExtendedOpcodes.OP_EQ:
        binaryOperation(this.stack, (a, b) => a === b ? 1 : 0, 'EQ');
        break;
      case ExtendedOpcodes.OP_NEQ:
        binaryOperation(this.stack, (a, b) => a !== b ? 1 : 0, 'NEQ');
        break;
      case ExtendedOpcodes.OP_LT:
        binaryOperation(this.stack, (a, b) => a < b ? 1 : 0, 'LT');
        break;
      case ExtendedOpcodes.OP_GT:
        binaryOperation(this.stack, (a, b) => a > b ? 1 : 0, 'GT');
        break;
      case ExtendedOpcodes.OP_LTE:
        binaryOperation(this.stack, (a, b) => a <= b ? 1 : 0, 'LTE');
        break;
      case ExtendedOpcodes.OP_GTE:
        binaryOperation(this.stack, (a, b) => a >= b ? 1 : 0, 'GTE');
        break;

      case ExtendedOpcodes.OP_AND:
        binaryOperation(this.stack, (a, b) => (a && b) ? 1 : 0, 'AND');
        break;
      case ExtendedOpcodes.OP_OR:
        binaryOperation(this.stack, (a, b) => (a || b) ? 1 : 0, 'OR');
        break;
      case ExtendedOpcodes.OP_NOT:
        unaryOperation(this.stack, a => a ? 0 : 1, 'NOT');
        break;
      case ExtendedOpcodes.OP_XOR:
        binaryOperation(this.stack, (a, b) => (a ? 1 : 0) ^ (b ? 1 : 0), 'XOR');
        break;

      case ExtendedOpcodes.OP_JMP:
        if (operand !== undefined) {
          this.programCounter = operand - 1;
        }
        break;
      case ExtendedOpcodes.OP_JIF:
        if (this.stack.length < 1) {
          throw new VMExecutionError('JIF', 'Stack underflow: JIF requires 1 operand');
        }
        const condition = this.stack.pop()!;
        if (condition && operand !== undefined) {
          this.programCounter = operand - 1;
        }
        break;

      case ExtendedOpcodes.OP_LOAD:
        if (operand !== undefined) {
          this.stack.push(this.memory[operand] || 0);
        } else {
          if (this.stack.length < 1) {
            throw new VMExecutionError('LOAD', 'LOAD requires address on stack');
          }
          const addr = this.stack.pop()!;
          this.stack.push(this.memory[addr] || 0);
        }
        break;
      case ExtendedOpcodes.OP_STORE:
        if (operand !== undefined) {
          if (this.stack.length < 1) {
            throw new VMExecutionError('STORE', 'STORE requires stack value');
          }
          this.memory[operand] = this.stack.pop()!;
        } else {
          if (this.stack.length < 2) {
            throw new VMExecutionError('STORE', 'STORE requires value and address on stack');
          }
          const addr2 = this.stack.pop()!;
          const val2 = this.stack.pop()!;
          this.memory[addr2] = val2;
        }
        break;

      case ExtendedOpcodes.OP_READ:
        if (this.input.length > 0) {
          this.stack.push(this.input.shift()!);
        } else {
          this.stack.push(0);
        }
        break;
      case ExtendedOpcodes.OP_WRITE:
        if (this.stack.length < 1) {
          throw new VMExecutionError('WRITE', 'Stack underflow: WRITE requires 1 operand');
        }
        this.output.push(this.stack.pop()!.toString());
        break;

      case ExtendedOpcodes.OP_FACT:
        unaryOperation(this.stack, n => { if (n < 0) throw new VMExecutionError('FACT', 'Factorial of negative number'); let result = 1; for (let i = 1; i <= n; i++) result *= i; return result; }, 'FACT');
        break;
      case ExtendedOpcodes.OP_FIB:
        unaryOperation(this.stack, n => { if (n < 0) throw new VMExecutionError('FIB', 'Fibonacci of negative number'); if (n <= 1) return n; let a3 = 0, b3 = 1; for (let i = 2; i <= n; i++) { [a3, b3] = [b3, a3 + b3]; } return b3; }, 'FIB');
        break;
      case ExtendedOpcodes.OP_SQRT:
        unaryOperation(this.stack, n => { if (n < 0) throw new VMExecutionError('SQRT', 'Square root of negative number'); return Math.floor(Math.sqrt(n)); }, 'SQRT');
        break;

      case ExtendedOpcodes.OP_NOP:
        break;
      case ExtendedOpcodes.OP_HALT:
        this.halted = true;
        break;
      case ExtendedOpcodes.OP_DEBUG:
        this.output.push(`DEBUG: Stack=[${this.stack.join(',')}], Memory=${JSON.stringify(this.memory)}`);
        break;

      default:
        throw new VMExecutionError('UNKNOWN', `Unknown opcode: ${opcode}`);
    }
  }

  private executeData(value?: number): void {
    if (value !== undefined) {
      this.output.push(String.fromCharCode(value));
    }
  }

  private executeBlock(blockType?: number, blockLength?: number): void {
    if (this.debugMode) {
      this.output.push(`BLOCK: type=${blockType}, length=${blockLength}`);
    }
  }

  getAdvancedResult(): AdvancedVMExecutionResult {
    return {
      output: [...this.output],
      stackSize: this.stack.length,
      operations: this.operations,
      executionTime: this.executionTime,
      memoryUsed: this.memoryUsed,
      instructionsExecuted: this.instructionsExecuted,
      errors: [...this.errors],
      warnings: [...this.warnings]
    };
  }

  getState() {
    return {
      stackSize: this.stack.length,
      outputLength: this.output.length,
      operations: this.operations,
      programCounter: this.programCounter,
      memorySize: Object.keys(this.memory).length,
      halted: this.halted,
      executionTime: this.executionTime,
      instructionsExecuted: this.instructionsExecuted
    };
  }

  getMemory() {
    return { ...this.memory };
  }
}

export { ExtendedOpcodes } from './opcodes';
export type { VMMemory, CallFrame } from './opcodes';
