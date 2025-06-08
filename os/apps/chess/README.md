# chess

Command line application that wires the chess engine into PrimeOS. It can run in interactive mode (human vs machine) or in automatic mode (machine vs machine) for a fixed depth.

## Installation

```bash
npm install chess
```

## Usage

```typescript
import { createAndInitializeChess } from 'chess';

const game = await createAndInitializeChess({ mode: 'human', depth: 3 });
await game.play();
```

### Command line examples

After building the project or running with `ts-node`, you can launch the game directly:

```bash
# Human plays against the engine for three half moves
npx ts-node os/apps/chess/index.ts --mode=human --depth=3

# Engine plays against itself for ten half moves
npx ts-node os/apps/chess/index.ts --mode=auto --depth=10
```

## API

- **`createChess(options?)`** – create a new game instance.
- **`createAndInitializeChess(options?)`** – helper that initializes the instance.
- **`play(): Promise<void>`** – start the CLI loop.

### Deterministic Behaviour

`chess` delegates all move generation to `chess-engine`. Because board states are encoded using deterministic prime mappings and the engine evaluates moves with the `EnhancedChunkVM`, the same command sequence will always yield the same result.

