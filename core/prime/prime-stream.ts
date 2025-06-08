import type { PrimeRegistryModel } from './registry';
import { Stream } from './types';
import { createBasicStream } from './utils';

export function createPrimeStreamImpl(registry: PrimeRegistryModel, startIdx = 0): Stream<bigint> {
  // Buffer size for each chunk
  const chunkSize = 100;

  // Initial setup
  let currentIdx = startIdx;
  let buffer: bigint[] = [];
  let position = 0;

  const loadChunk = (fromIndex: number, count: number): bigint[] => {
    const primes: bigint[] = [];
    for (let i = fromIndex; i < fromIndex + count; i++) {
      try {
        primes.push(registry.getPrime(i));
      } catch {
        break;
      }
    }
    return primes;
  };

  buffer = loadChunk(currentIdx, chunkSize);

  const stream: Stream<bigint> = {
    [Symbol.iterator](): Iterator<bigint> {
      position = 0;
      return {
        next(): IteratorResult<bigint> {
          if (position < buffer.length) {
            return { value: buffer[position++], done: false };
          }
          currentIdx += buffer.length;
          buffer = loadChunk(currentIdx, chunkSize);
          position = 0;
          if (buffer.length === 0) {
            return { done: true, value: undefined as any };
          }
          return { value: buffer[position++], done: false };
        }
      };
    },

    next(): IteratorResult<bigint> {
      if (position < buffer.length) {
        return { value: buffer[position++], done: false };
      }
      currentIdx += buffer.length;
      buffer = loadChunk(currentIdx, chunkSize);
      position = 0;
      if (buffer.length === 0) {
        return { done: true, value: undefined as any };
      }
      return { value: buffer[position++], done: false };
    },

    map<U>(fn: (value: bigint) => U): Stream<U> {
      return createBasicStream(buffer.map(fn));
    },

    filter(fn: (value: bigint) => boolean): Stream<bigint> {
      return createBasicStream(buffer.filter(fn));
    },

    take(n: number): Stream<bigint> {
      while (buffer.length < n && buffer.length > 0) {
        const nextBatch = loadChunk(currentIdx + buffer.length, chunkSize);
        if (nextBatch.length === 0) break;
        buffer = [...buffer, ...nextBatch];
      }
      return createBasicStream(buffer.slice(0, n));
    },

    skip(n: number): Stream<bigint> {
      return createPrimeStreamImpl(registry, startIdx + n);
    },

    async reduce<U>(fn: (acc: U, value: bigint) => U, initial: U): Promise<U> {
      let result = initial;
      let keepGoing = true;
      position = 0;
      currentIdx = startIdx;
      buffer = loadChunk(currentIdx, chunkSize);
      while (keepGoing) {
        for (let i = 0; i < buffer.length; i++) {
          result = fn(result, buffer[i]);
        }
        currentIdx += buffer.length;
        buffer = loadChunk(currentIdx, chunkSize);
        if (buffer.length === 0) {
          keepGoing = false;
        }
      }
      return result;
    },

    async forEach(fn: (value: bigint) => void): Promise<void> {
      let keepGoing = true;
      position = 0;
      currentIdx = startIdx;
      buffer = loadChunk(currentIdx, chunkSize);
      while (keepGoing) {
        for (let i = 0; i < buffer.length; i++) {
          fn(buffer[i]);
        }
        currentIdx += buffer.length;
        buffer = loadChunk(currentIdx, chunkSize);
        if (buffer.length === 0) {
          keepGoing = false;
        }
      }
    },

    async toArray(): Promise<bigint[]> {
      const maxPrimes = 10000;
      const result: bigint[] = [];
      position = 0;
      currentIdx = startIdx;
      buffer = loadChunk(currentIdx, chunkSize);
      while (buffer.length > 0 && result.length < maxPrimes) {
        result.push(...buffer);
        currentIdx += buffer.length;
        buffer = loadChunk(currentIdx, chunkSize);
      }
      return result;
    },

    getBuffer(): bigint[] {
      return [...buffer];
    },

    concat(other: Stream<bigint>): Stream<bigint> {
      const otherBuffer = other.getBuffer ? other.getBuffer() : [];
      return createBasicStream([...buffer, ...otherBuffer]);
    },

    branch(): Stream<bigint> {
      return createPrimeStreamImpl(registry, startIdx);
    }
  };

  return stream;
}
