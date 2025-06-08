/**
 * Prime Module Implementation
 * ==========================
 *
 * This module implements the first axiom of the UOR kernel system:
 * "Prime Number Foundation: All representation derives from prime numbers"
 *
 * It provides tools for working with prime numbers, which form the basis for
 * all data representation in the PrimeOS architecture.
 *
 * This implementation follows the PrimeOS Model interface pattern for
 * consistent lifecycle management and state tracking.
 */

import {
  BaseModel,
  ModelResult,
  ModelLifecycleState,
  ModelOptions
} from '../../os/model';

import { createLogging } from '../../os/logging';

import {
  PrimeRegistryOptions,
  PrimeRegistryInterface as IPrimeRegistry,
  StreamingPrimeRegistryInterface,
  Factor,
  Stream,
  StreamingChunk,
  StreamingOptions,
  StreamProcessor,
  PrimeProcessInput,
  PrimeState
} from './types';

import {
  createBasicStream,
  mod,
  modPow,
  integerSqrt,
  isPerfectSquare,
  reconstructFromFactors
} from './utils';

import { isProbablePrime } from '../precision';

import { createPrimeStreamImpl } from './prime-stream';
import { createFactorStreamImpl } from './factor-stream';
import { createStreamProcessorImpl, factorizeStreamingImpl } from './stream-processor';
import { MAX_SAFE_INTEGER_BIGINT, MAX_SAFE_SQRT } from './constants';

const DEFAULT_OPTIONS: PrimeRegistryOptions = {
  preloadCount: 5,
  useStreaming: false,
  streamChunkSize: 1024,
  enableLogs: false,
  debug: false,
  name: 'prime-registry',
  version: '1.0.0'
};

export class PrimeRegistryModel extends BaseModel implements IPrimeRegistry, StreamingPrimeRegistryInterface {
  private primes: bigint[] = [2n];
  private primeIndices: Map<string, number> = new Map([['2', 0]]);
  private config: {
    streamingEnabled: boolean;
    chunkSize: number;
    enableLogs: boolean;
    preloadCount: number;
  };
  private metrics = {
    factorizations: 0,
    primalityTests: 0,
    streamOperations: 0,
    factorizationTimes: [] as number[]
  };

  constructor(options: PrimeRegistryOptions = {}) {
    super({ ...DEFAULT_OPTIONS, ...options });
    this.config = {
      streamingEnabled: options.useStreaming ?? DEFAULT_OPTIONS.useStreaming!,
      chunkSize: options.streamChunkSize ?? DEFAULT_OPTIONS.streamChunkSize!,
      enableLogs: options.enableLogs ?? DEFAULT_OPTIONS.enableLogs!,
      preloadCount: options.preloadCount ?? DEFAULT_OPTIONS.preloadCount!
    };
  }

  protected async onInitialize(): Promise<void> {
    await this.logger.info('Initializing Prime Registry module', { config: this.config });
    try {
      const options = this.options as PrimeRegistryOptions;
      if (options.initialPrimes && options.initialPrimes.length > 0) {
        this.primes = [...options.initialPrimes];
        this.primeIndices.clear();
        this.primes.forEach((p, idx) => this.primeIndices.set(p.toString(), idx));
        await this.logger.debug(`Initialized with ${options.initialPrimes.length} custom primes`);
      }
      this.extendTo(this.config.preloadCount);
      this.state.custom = {
        config: this.config,
        cache: this._getCacheStats(),
        metrics: this._getMetrics()
      };
      await this.logger.info('Prime Registry module initialized successfully', {
        primeCount: this.primes.length,
        largestPrime: this.primes[this.primes.length - 1]
      });
    } catch (error) {
      await this.logger.error('Failed to initialize Prime Registry module', error);
      throw error;
    }
  }

  protected async onProcess<T = PrimeProcessInput, R = unknown>(input: T): Promise<R> {
    if (!input || typeof input !== 'object') {
      throw new Error('Input cannot be undefined or null');
    }

    await this.logger.debug('Processing input', input);

    if (typeof input === 'object' && input !== null && 'operation' in input && 'params' in input) {
      const request = input as unknown as PrimeProcessInput;
      switch (request.operation) {
        case 'isPrime':
          this.metrics.primalityTests++;
          return this.isPrime(request.params[0] as bigint) as unknown as R;
        case 'getPrime':
          return this.getPrime(request.params[0] as number) as unknown as R;
        case 'getIndex':
          return this.getIndex(request.params[0] as bigint) as unknown as R;
        case 'factor':
          this.metrics.factorizations++;
          const startTime = performance.now();
          const result = this.factor(request.params[0] as bigint);
          const duration = performance.now() - startTime;
          this.metrics.factorizationTimes.push(duration);
          if (this.metrics.factorizationTimes.length > 1000) {
            this.metrics.factorizationTimes.shift();
          }
          return result as unknown as R;
        case 'createPrimeStream':
          this.metrics.streamOperations++;
          return this.createPrimeStream(request.params[0] as number) as unknown as R;
        case 'createFactorStream':
          this.metrics.streamOperations++;
          return this.createFactorStream(request.params[0] as bigint) as unknown as R;
        case 'factorizeStreaming':
          return this.factorizeStreaming(request.params[0] as any) as unknown as R;
        case 'getVersion':
          return this.getVersion() as unknown as R;
        case 'clearCache':
          this.clearCache();
          return undefined as unknown as R;
        default:
          throw new Error(`Unknown operation: ${(request as any).operation}`);
      }
    } else {
      return input as unknown as R;
    }
  }

  protected async onReset(): Promise<void> {
    await this.logger.info('Resetting Prime Registry module');
    this.primes = [2n];
    this.primeIndices = new Map([['2', 0]]);
    this.metrics = {
      factorizations: 0,
      primalityTests: 0,
      streamOperations: 0,
      factorizationTimes: []
    };
    this.extendTo(this.config.preloadCount);
    this.state.custom = {
      config: this.config,
      cache: this._getCacheStats(),
      metrics: this._getMetrics()
    };
    await this.logger.info('Prime Registry module reset complete');
  }

  protected async onTerminate(): Promise<void> {
    await this.logger.info('Terminating Prime Registry module');
    this.primes = [];
    this.primeIndices.clear();
    await this.logger.info('Prime Registry module terminated');
  }

  getState(): PrimeState {
    const baseState = super.getState();
    if (this.state.custom) {
      this.state.custom.cache = this._getCacheStats();
      this.state.custom.metrics = this._getMetrics();
    }
    return {
      ...baseState,
      config: this.config,
      cache: this._getCacheStats(),
      metrics: this._getMetrics()
    } as PrimeState;
  }

  getVersion(): string {
    return this.options.version || '1.0.0';
  }

  clearCache(): void {
    this.primes = [2n];
    this.primeIndices = new Map([['2', 0]]);
    if (this.config.enableLogs) {
      this.logger.debug('Prime cache cleared').catch(() => {});
    }
  }

  isPrime(n: bigint): boolean {
    if (n < 2n) return false;
    if (this.primeIndices.has(n.toString())) return true;
    if (n > 1000000n) {
      return isProbablePrime(n);
    }
    const sqrt = this.integerSqrt(n);
    while (this.primes.length > 0 && this.primes[this.primes.length - 1] <= sqrt) {
      let candidate = this.primes[this.primes.length - 1] + 1n;
      let foundPrime = false;
      while (!foundPrime) {
        foundPrime = true;
        for (const p of this.primes) {
          if (p * p > candidate) break;
          if (candidate % p === 0n) {
            foundPrime = false;
            break;
          }
        }
        if (foundPrime) {
          this.primes.push(candidate);
          this.primeIndices.set(candidate.toString(), this.primes.length - 1);
        } else {
          candidate++;
        }
      }
    }
    for (const p of this.primes) {
      if (p > sqrt) break;
      if (mod(n, p) === 0n) return false;
    }
    return true;
  }

  integerSqrt(n: bigint): bigint {
    return integerSqrt(n);
  }

  extendTo(idx: number): void {
    if (idx < this.primes.length) return;
    let candidate = this.primes[this.primes.length - 1] + 1n;
    while (this.primes.length <= idx) {
      if (this.isPrime(candidate)) {
        this.primes.push(candidate);
        this.primeIndices.set(candidate.toString(), this.primes.length - 1);
        if (this.config.enableLogs && this.primes.length % 1000 === 0) {
          this.logger.debug(`Prime cache extended to ${this.primes.length} primes`).catch(() => {});
        }
      }
      candidate += 1n;
    }
  }

  getPrime(idx: number): bigint {
    this.extendTo(idx);
    return this.primes[idx];
  }

  getIndex(prime: bigint): number {
    const primeStr = prime.toString();
    if (!this.primeIndices.has(primeStr)) {
      if (!this.isPrime(prime)) {
        throw new Error(`${prime} is not a prime number`);
      }
      this.extendTo(this.primes.length);
      if (!this.primeIndices.has(primeStr)) {
        this.primes.push(prime);
        this.primeIndices.set(primeStr, this.primes.length - 1);
      }
    }
    return this.primeIndices.get(primeStr) || 0;
  }

  factor(x: bigint): Factor[] {
    if (x <= 0n) {
      throw new Error('Can only factor positive integers');
    }
    if (x === 1n) {
      return [];
    }
    const factors: Factor[] = [];
    let i = 0;
    let remaining = x;
    while (true) {
      const p = this.getPrime(i);
      if (p * p > remaining) break;
      if (remaining % p === 0n) {
        let count = 0;
        while (remaining % p === 0n) {
          remaining /= p;
          count++;
        }
        factors.push({ prime: p, exponent: count });
      }
      i++;
    }
    if (remaining > 1n) {
      if (!this.primeIndices.has(remaining.toString())) {
        this.getIndex(remaining);
      }
      factors.push({ prime: remaining, exponent: 1 });
    }
    return factors;
  }

  createPrimeStream(startIdx: number = 0): Stream<bigint> {
    return createPrimeStreamImpl(this, startIdx);
  }

  createFactorStream(x: bigint): Stream<Factor> {
    return createFactorStreamImpl(this, x);
  }

  createStreamProcessor(options: StreamingOptions = {}): StreamProcessor {
    return createStreamProcessorImpl(this, options);
  }

  async factorizeStreaming(stream: AsyncIterable<StreamingChunk> | StreamingChunk[]): Promise<Factor[]> {
    return factorizeStreamingImpl(this, stream);
  }

  private _getCacheStats() {
    return {
      size: this.primes.length,
      hits: 0,
      misses: 0,
      primeCount: this.primes.length,
      largestPrime: this.primes.length > 0 ? this.primes[this.primes.length - 1] : BigInt(0)
    };
  }

  private _getMetrics() {
    const avgFactorizationTime = this.metrics.factorizationTimes.length > 0
      ? this.metrics.factorizationTimes.reduce((a, b) => a + b, 0) / this.metrics.factorizationTimes.length
      : 0;
    return {
      factorizations: this.metrics.factorizations,
      primalityTests: this.metrics.primalityTests,
      streamOperations: this.metrics.streamOperations,
      averageFactorizationTime: avgFactorizationTime
    };
  }
}

export function createPrimeRegistry(options: PrimeRegistryOptions = {}): PrimeRegistryModel {
  return new PrimeRegistryModel(options);
}

export async function createAndInitializePrimeRegistry(
  options: PrimeRegistryOptions = {}
): Promise<PrimeRegistryModel> {
  const model = new PrimeRegistryModel(options);
  const result = await model.initialize();
  if (!result.success) {
    throw new Error(`Failed to initialize prime registry: ${result.error}`);
  }
  return model;
}

export * from './types';
export * from './utils';
