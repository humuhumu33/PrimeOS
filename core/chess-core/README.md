# chess-core

Low level chess utilities for PrimeOS. The module provides deterministic prime-based encoding for board states and helpers for converting to and from FEN notation.

## Installation

```bash
npm install chess-core
```

## Usage

```typescript
import {
  fenToBoardState,
  boardStateToFen,
  encodeBoard,
  decodeBoard
} from 'chess-core';

// convert FEN to structured board
const state = fenToBoardState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

// encode board into a bigint using prime factors
const encoded = await encodeBoard(state);

// decode back to board state
const roundTrip = await decodeBoard(encoded);
console.log(boardStateToFen(roundTrip)); // original FEN
```

## API

### `fenToBoardState(fen: string): BoardState`
Convert a FEN string into a structured `BoardState` object.

### `boardStateToFen(state: BoardState): string`
Convert a `BoardState` back into FEN notation.

### `encodeBoard(state: BoardState): Promise<bigint>`
Returns a bigint obtained by multiplying the unique primes assigned to each piece/square pair.

### `decodeBoard(encoded: bigint): Promise<BoardState>`
Factorizes the bigint back into the corresponding board state.

### Deterministic Behaviour

Prime mappings are generated once by the prime registry. Each piece/square pair always maps to the same prime, so encoding and decoding yield the exact same result across runs. This deterministic representation is used by higher layers such as `chess-engine` for reproducible state evaluation.

