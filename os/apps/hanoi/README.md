# hanoi

Tower of Hanoi solver

## Overview

This module follows the standard PrimeOS module pattern, implementing the PrimeOS Model interface for consistent lifecycle management, state tracking, error handling, and integrated logging.

## Features

- Fully integrates with the PrimeOS model system
- Built-in logging capabilities
- Standard lifecycle management (initialize, process, reset, terminate)
- Automatic error handling and result formatting
- Deterministic recursive solver for any starting configuration

## Installation

```bash
npm install hanoi
```

## Usage

```typescript
import { createAndInitializeHanoi } from 'hanoi';

// Create and initialize with 3 disks
const hanoi = await createAndInitializeHanoi({ disks: 3 });

// Automatically solve the puzzle
await hanoi.solve();

console.log(hanoi.getState().towers);

await hanoi.terminate();
```

## API

### `createHanoi(options)`

Creates a new hanoi instance with the specified options.

Parameters:
- `options` - Optional configuration options

Returns:
- A hanoi instance implementing HanoiInterface

### HanoiInterface

The main interface implemented by hanoi. Extends the ModelInterface.

Methods:
- `initialize()` - Initialize the module (required before processing)
- `process<T, R>(input: T)` - Process the input data and return a result
- `reset()` - Reset the module to its initial state
- `terminate()` - Release resources and shut down the module
- `getState()` - Get the current module state
- `getLogger()` - Get the module's logger instance

### Options

Configuration options for hanoi:

```typescript
interface HanoiOptions {
  // Enable debug mode
  debug?: boolean;
  
  // Module name
  name?: string;
  
  // Module version
  version?: string;

  // Number of disks
  disks?: number;

  // Custom starting towers
  towers?: number[][];
}
```

### Result Format

All operations return a standardized result format:

```typescript
{
  success: true,          // Success indicator
  data: { ... },          // Operation result data
  timestamp: 1620000000,  // Operation timestamp
  source: 'module-name'   // Source module
}
```

## Lifecycle Management

The module follows a defined lifecycle:

1. **Uninitialized**: Initial state when created
2. **Initializing**: During setup and resource allocation
3. **Ready**: Available for processing
4. **Processing**: Actively handling an operation
5. **Error**: Encountered an issue
6. **Terminating**: During resource cleanup
7. **Terminated**: Final state after cleanup

Always follow this sequence:
1. Create the module with `createAndInitializeHanoi`
2. Call `solve()` or process moves
3. Clean up with `terminate()`

## Custom Implementation

You can extend the functionality by adding module-specific methods to the implementation.

## CLI Usage

A command line entry is available at `src/cli.ts`:

```bash
npx ts-node src/cli.ts --disks=4 --auto
```

Use `--no-auto` to just display the initial state without solving.

## Error Handling

Errors are automatically caught and returned in a standardized format:

```typescript
{
  success: false,
  error: "Error message",
  timestamp: 1620000000,
  source: "module-name"
}
```
