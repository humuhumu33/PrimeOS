export enum ExtendedOpcodes {
  // Arithmetic operations
  OP_SUB = 13,
  OP_MUL = 17,
  OP_DIV = 19,
  OP_MOD = 23,
  OP_POW = 29,

  // Stack operations
  OP_DUP = 31,
  OP_SWAP = 37,
  OP_POP = 41,
  OP_CLEAR = 43,

  // Comparison operations
  OP_EQ = 47,
  OP_NEQ = 53,
  OP_LT = 59,
  OP_GT = 61,
  OP_LTE = 67,
  OP_GTE = 71,

  // Logical operations
  OP_AND = 73,
  OP_OR = 79,
  OP_NOT = 83,
  OP_XOR = 89,

  // Control flow
  OP_JMP = 97,
  OP_JIF = 101,
  OP_CALL = 103,
  OP_RET = 107,

  // Memory operations
  OP_LOAD = 109,
  OP_STORE = 113,

  // I/O operations
  OP_READ = 127,
  OP_WRITE = 131,

  // Advanced operations
  OP_FACT = 137,
  OP_FIB = 139,
  OP_PRIME = 149,
  OP_SQRT = 151,

  // Data type operations
  OP_INT = 157,
  OP_STR = 163,
  OP_BOOL = 167,

  // Array operations
  OP_ARRAY = 173,
  OP_INDEX = 179,
  OP_LENGTH = 181,
  OP_APPEND = 191,

  // Special operations
  OP_NOP = 193,
  OP_HALT = 197,
  OP_DEBUG = 199
}

export interface VMMemory {
  [address: number]: any;
}

export interface CallFrame {
  returnAddress: number;
  locals: any[];
}
