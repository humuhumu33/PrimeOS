function createMockStream<T>(values: T[]): Stream<T> {
  let position = 0;
  const buffer = [...values];

  return {
    [Symbol.iterator](): Iterator<T> {
      let iterPosition = 0;
      return {
        next(): IteratorResult<T> {
          if (iterPosition < buffer.length) {
            return { value: buffer[iterPosition++], done: false };
          }
          return { done: true, value: undefined as any };
        }
      };
    },

    next(): IteratorResult<T> {
      if (position < buffer.length) {
        return { value: buffer[position++], done: false };
      }
      return { done: true, value: undefined as any };
    },

    map<U>(fn: (value: T) => U): Stream<U> {
      return createMockStream(buffer.map(fn));
    },

    filter(fn: (value: T) => boolean): Stream<T> {
      return createMockStream(buffer.filter(fn));
    },

    take(n: number): Stream<T> {
      return createMockStream(buffer.slice(0, n));
    },

    skip(n: number): Stream<T> {
      return createMockStream(buffer.slice(n));
    },

    async reduce<U>(fn: (acc: U, value: T) => U, initial: U): Promise<U> {
      return buffer.reduce(fn, initial);
    },

    async forEach(fn: (value: T) => void): Promise<void> {
      buffer.forEach(fn);
    },

    async toArray(): Promise<T[]> {
      return [...buffer];
    },

    getBuffer(): T[] {
      return [...buffer];
    },

    concat(other: Stream<T>): Stream<T> {
      const otherBuffer = other.getBuffer ? other.getBuffer() : [];
      return createMockStream([...buffer, ...otherBuffer]);
    },

    branch(): Stream<T> {
      return createMockStream([...buffer]);
    }
  };
}

import { Stream, Factor } from '../types';
import { MockPrimeRegistryModel } from './registry';

export function createBasicStream<T>(values: T[]): Stream<T> {
  return createMockStream(values);
}

export function mod(a: bigint, m: bigint): bigint {
  const result = a % m;
  return result < 0n ? result + m : result;
}

export function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (modulus === 1n) return 0n;
  let result = 1n;
  base = mod(base, modulus);
  while (exponent > 0n) {
    if (exponent % 2n === 1n) {
      result = mod(result * base, modulus);
    }
    exponent = exponent / 2n;
    base = mod(base * base, modulus);
  }
  return result;
}

export function integerSqrt(n: bigint): bigint {
  if (n < 0n) {
    throw new Error('Square root of negative number is not defined');
  }
  if (n < 2n) return n;
  let x = n;
  let prev;
  do {
    prev = x;
    x = (x + n / x) / 2n;
  } while (x < prev);
  return prev;
}

export function isPerfectSquare(n: bigint): boolean {
  if (n < 0n) return false;
  if (n === 0n) return true;
  const root = integerSqrt(n);
  return root * root === n;
}

export function reconstructFromFactors(factors: Factor[]): bigint {
  return factors.reduce(
    (acc, { prime, exponent }) => acc * (prime ** BigInt(exponent)),
    1n
  );
}

export * from '../types';
export const PrimeRegistryModel = MockPrimeRegistryModel;

if (typeof jest === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).jest = {
    fn: () => ({
      mockResolvedValue: (value: any) => () => Promise.resolve(value),
      mockReturnValue: (value: any) => () => value
    })
  } as any;
}
