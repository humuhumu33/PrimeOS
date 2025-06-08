import type { PrimeRegistryModel } from './registry';
import { Stream, Factor } from './types';
import { createBasicStream } from './utils';
import { MAX_SAFE_INTEGER_BIGINT } from './constants';

export function createFactorStreamImpl(registry: PrimeRegistryModel, x: bigint): Stream<Factor> {
  if (x <= 0n) {
    throw new Error('Can only factor positive integers');
  }

  if (x < MAX_SAFE_INTEGER_BIGINT) {
    const factors = registry.factor(x);
    return createBasicStream(factors);
  }

  let factorBuffer: Factor[] = [];
  let position = 0;
  let completed = false;

  const stream: Stream<Factor> = {
    [Symbol.iterator](): Iterator<Factor> {
      position = 0;
      return {
        next(): IteratorResult<Factor> {
          if (position < factorBuffer.length) {
            return { value: factorBuffer[position++], done: false };
          }
          if (!completed && factorBuffer.length === 0) {
            try {
              factorBuffer = registry.factor(x);
              completed = true;
            } catch (error) {
              registry.logger.error('Error in factorization', error).catch(() => {});
              completed = true;
            }
            if (position < factorBuffer.length) {
              return { value: factorBuffer[position++], done: false };
            }
          }
          return { done: true, value: undefined as any };
        }
      };
    },

    next(): IteratorResult<Factor> {
      if (position < factorBuffer.length) {
        return { value: factorBuffer[position++], done: false };
      }
      if (!completed && factorBuffer.length === 0) {
        try {
          factorBuffer = registry.factor(x);
          completed = true;
        } catch (error) {
          registry.logger.error('Error in factorization', error).catch(() => {});
          completed = true;
        }
        if (position < factorBuffer.length) {
          return { value: factorBuffer[position++], done: false };
        }
      }
      return { done: true, value: undefined as any };
    },

    map<U>(fn: (value: Factor) => U): Stream<U> {
      if (!completed) {
        factorBuffer = registry.factor(x);
        completed = true;
      }
      return createBasicStream(factorBuffer.map(fn));
    },

    filter(fn: (value: Factor) => boolean): Stream<Factor> {
      if (!completed) {
        factorBuffer = registry.factor(x);
        completed = true;
      }
      return createBasicStream(factorBuffer.filter(fn));
    },

    take(n: number): Stream<Factor> {
      if (!completed) {
        factorBuffer = registry.factor(x);
        completed = true;
      }
      return createBasicStream(factorBuffer.slice(0, n));
    },

    skip(n: number): Stream<Factor> {
      position += n;
      return this;
    },

    async reduce<U>(fn: (acc: U, value: Factor) => U, initial: U): Promise<U> {
      if (!completed) {
        factorBuffer = registry.factor(x);
        completed = true;
      }
      return factorBuffer.reduce(fn, initial);
    },

    async forEach(fn: (value: Factor) => void): Promise<void> {
      if (!completed) {
        factorBuffer = registry.factor(x);
        completed = true;
      }
      factorBuffer.forEach(fn);
    },

    async toArray(): Promise<Factor[]> {
      if (!completed) {
        factorBuffer = registry.factor(x);
        completed = true;
      }
      return [...factorBuffer];
    },

    getBuffer(): Factor[] {
      if (!completed) {
        factorBuffer = registry.factor(x);
        completed = true;
      }
      return [...factorBuffer];
    },

    concat(other: Stream<Factor>): Stream<Factor> {
      if (!completed) {
        factorBuffer = registry.factor(x);
        completed = true;
      }
      const otherBuffer = other.getBuffer ? other.getBuffer() : [];
      return createBasicStream([...factorBuffer, ...otherBuffer]);
    },

    branch(): Stream<Factor> {
      return createFactorStreamImpl(registry, x);
    }
  };

  return stream;
}
