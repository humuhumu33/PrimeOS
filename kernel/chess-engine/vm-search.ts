export function createSearchProgram(depth: number) {
  // Memory layout:
  // 0 -> current depth
  // 1 -> alpha
  // 2 -> beta
  // 3 -> best evaluation
  // 4 -> best move index
  // The actual evaluation and move generation are implemented in
  // separate programs and executed through the VM. This helper
  // only sets up the basic minimax structure with alpha-beta pruning.

  const program: any[] = [];

  // store depth
  program.push({ type: 'operation', opcode: 0, operand: depth });
  program.push({ type: 'operation', opcode: 113, operand: 0 });

  // alpha = -Infinity
  program.push({ type: 'operation', opcode: 0, operand: -0x7fffffff });
  program.push({ type: 'operation', opcode: 113, operand: 1 });

  // beta = Infinity
  program.push({ type: 'operation', opcode: 0, operand: 0x7fffffff });
  program.push({ type: 'operation', opcode: 113, operand: 2 });

  // best evaluation placeholder
  program.push({ type: 'operation', opcode: 0, operand: -0x7fffffff });
  program.push({ type: 'operation', opcode: 113, operand: 3 });

  // best move index (placeholder 0)
  program.push({ type: 'operation', opcode: 0, operand: 0 });
  program.push({ type: 'operation', opcode: 113, operand: 4 });

  // TODO: implement recursion and alpha-beta pruning
  // For now this program does nothing besides storing initial values
  program.push({ type: 'operation', opcode: 197 }); // HALT

  return program;
}
