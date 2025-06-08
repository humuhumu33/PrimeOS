import { Stream, StreamProcessingError, MemoryStats } from "../types";
import { getMemoryStats } from "./memory-utils";
import { AdvancedStream } from "./advanced-stream";

/**
 * Create a stream from an array with full functionality
 */
export function createStreamFromArray<T>(data: T[]): Stream<T> {
  return new AdvancedStream(data);
}

/**
 * Create an async iterable from an array with rate limiting
 */
export async function* createAsyncIterable<T>(
  items: T[], 
  options: { 
    rateLimit?: number; // items per second
    delayMs?: number;   // fixed delay between items
  } = {}
): AsyncIterable<T> {
  const delay = options.delayMs || (options.rateLimit ? 1000 / options.rateLimit : 0);
  
  for (const item of items) {
    yield item;
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Create a stream from an async iterable
 */
export async function streamFromAsyncIterable<T>(source: AsyncIterable<T>): Promise<Stream<T>> {
  return new AdvancedStream(source);
}

export * from "./stream-transforms";
