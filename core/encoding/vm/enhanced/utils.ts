import { VMMemory, CallFrame } from './opcodes';
import { VMExecutionError } from '../../core/types';

export function binaryOperation(stack: any[], op: (a: any, b: any) => any, name: string): void {
  if (stack.length < 2) {
    throw new VMExecutionError(name, `Stack underflow: ${name} requires 2 operands`);
  }
  const b = stack.pop()!;
  const a = stack.pop()!;
  stack.push(op(a, b));
}

export function unaryOperation(stack: any[], op: (a: any) => any, name: string): void {
  if (stack.length < 1) {
    throw new VMExecutionError(name, `Stack underflow: ${name} requires 1 operand`);
  }
  const a = stack.pop()!;
  stack.push(op(a));
}

export function calculateMemoryUsage(stack: any[], memory: VMMemory, callStack: CallFrame[]): number {
  return JSON.stringify({ stack, memory, callStack }).length;
}
