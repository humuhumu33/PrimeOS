# chess-engine

ChessEngine implementation for PrimeOS

## Overview

This module follows the standard PrimeOS module pattern, implementing the PrimeOS Model interface for consistent lifecycle management, state tracking, error handling, and integrated logging.

## Features

- Fully integrates with the PrimeOS model system
- Built-in logging capabilities
- Standard lifecycle management (initialize, process, reset, terminate)
- Automatic error handling and result formatting

## Installation

```bash
npm install chess-engine
```

## Usage

```typescript
import { createChessEngine } from 'chess-engine';

// Create an instance
const instance = createChessEngine({
  debug: true,
  name: 'chess-engine-instance',
  version: '1.0.0'
});

// Initialize the module
await instance.initialize();

// Process data
const result = await instance.process('example-input');
console.log(result);

// Clean up when done
await instance.terminate();
```

## API

### `createChessEngine(options)`

Creates a new chess-engine instance with the specified options.

Parameters:
- `options` - Optional configuration options

Returns:
- A chess-engine instance implementing ChessEngineInterface

### ChessEngineInterface

The main interface implemented by chess-engine. Extends the ModelInterface.

Methods:
- `initialize()` - Initialize the module (required before processing)
- `process<T, R>(input: T)` - Process the input data and return a result
- `reset()` - Reset the module to its initial state
- `terminate()` - Release resources and shut down the module
- `getState()` - Get the current module state
- `getLogger()` - Get the module's logger instance

### Options

Configuration options for chess-engine:

```typescript
interface ChessEngineOptions {
  // Enable debug mode
  debug?: boolean;
  
  // Module name
  name?: string;
  
  // Module version
  version?: string;
  
  // Module-specific options
  // ...
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
1. Create the module with `createChessEngine`
2. Initialize with `initialize()`
3. Process data with `process()`
4. Clean up with `terminate()`

## Custom Implementation

You can extend the functionality by adding module-specific methods to the implementation.

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
