# chess-engine

The evaluation engine for PrimeOS chess. It builds on `chess-core` for board representation and uses the UOR virtual machine to run prime-encoded evaluation programs.

## Installation

```bash
npm install chess-engine
```

## Usage

```typescript
import { createAndInitializeChessEngine } from 'chess-engine';
import { fenToBoardState } from 'chess-core';

const engine = await createAndInitializeChessEngine();
await engine.loadPosition(fenToBoardState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'));

const best = await engine.computeMove();
console.log(best);
await engine.applyMove(best!);
```

## API

- **`createChessEngine(options?)`** – create a new engine instance.
- **`createAndInitializeChessEngine(options?)`** – helper that also calls `initialize()`.
- **`computeMove(): Promise<ChessMove | null>`** – deterministically calculates the best move for the current board.
- **`applyMove(move: ChessMove): Promise<void>`** – apply a move to the internal board.
- **`loadPosition(board: BoardState): Promise<void>`** – replace the current board state.
- **`train(dataset: ChessGame[]): Promise<void>`** – adjust the evaluation table.

### Deterministic Behaviour

`computeMove()` relies on the prime-based board encoding from `chess-core` combined with evaluation programs executed through the `EnhancedChunkVM`. Given the same position and training data the output move is always the same, ensuring reproducible results.

### Prime Encoding and UOR VM

Moves and evaluation routines are expressed as arrays of prime encoded chunks. These chunks are executed by the UOR virtual machine (`EnhancedChunkVM`), which interprets standard opcodes such as `OP_PUSH`, `OP_ADD` and extended instructions. The VM's deterministic stack execution, together with the fixed prime mapping, guarantees consistent behaviour on any platform.

