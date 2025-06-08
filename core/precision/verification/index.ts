/**
 * Verification Implementation
 * ========================
 *
 * This module provides data integrity verification capabilities.
 * Implements the PrimeOS Model interface pattern for consistent lifecycle management.
 */


import {
  VerificationOptions,
  VerificationInterface,
  VerificationResult,
  VerificationStatus,
  PrimeRegistryForVerification,
  VerificationModelInterface,
  VerificationState,
  VerificationProcessInput,
  RetryOptions
} from './types';

import {
  extractFactorsAndChecksum,
  calculateChecksum,
  ChecksumExtractionResult
} from '../checksums';

import {
  BaseModel,
  ModelResult,
  ModelLifecycleState
} from '../../../os/model';

import { createLogging, LoggingInterface } from '../../../os/logging';
import { 
  createLRUCache, 
  CacheModelInterface, 
  CacheOptions 
} from '../cache';

// Export cache factory
export { createCacheFactory } from './cache-factory';

import {
  VerificationError,
  ValidationError,
  ChecksumMismatchError,
  PrimeRegistryError,
  CacheError,
  TransientError,
  createValidationError,
  createChecksumMismatchError,
  createPrimeRegistryError,
  createCacheError,
  createTransientError,
  retryWithBackoff
} from './errors';

/**
 * Default options for verification operations
 */
export const DEFAULT_OPTIONS: VerificationOptions = {
  debug: false,
  failFast: false,
  cacheSize: 1000,
  enableCache: true,
  enableRetry: false,
  retryOptions: {
    maxRetries: 3,
    initialDelay: 100,
    maxDelay: 1000,
    backoffFactor: 2
  },
  // Basic resilience options
  enableRateLimit: false,
  rateLimit: 100,
  rateLimitBurst: 20,
  enableCircuitBreaker: false,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 30000,
  // Advanced resilience options
  useAdvancedRateLimiter: false,
  enableDynamicRateAdjustment: false,
  minRateLimit: 50,
  maxRateLimit: 200,
  loadThreshold: 70,
  adjustmentFactor: 0.5,
  useAdvancedCircuitBreaker: false,
  enableDegradedState: false,
  degradedStateThreshold: 50,
  healthCheckInterval: 60000,
  name: 'precision-verification',
  version: '1.0.0'
};

// Import event emitter
import { 
  createEventEmitter, 
  EventEmitter, 
  VerificationEventType 
} from './events';

// Import metrics collector
import { 
  createMetricsCollector, 
  MetricsCollector, 
  MetricsOptions 
} from './metrics';

// Import resilience modules
import { 
  createRateLimiter, 
  createCircuitBreaker, 
  createAdvancedRateLimiter,
  createAdvancedCircuitBreaker,
  RateLimiter, 
  CircuitBreaker, 
  RateLimitExceededError, 
  CircuitOpenError,
  OperationRateLimitExceededError,
  CircuitDegradedError,
  FailureCategory
} from './resilience';

// Import synchronous verification functions
import {
  verifyValueSync,
  verifyValuesSync,
  createOptimizedVerifierSync
} from './sync-verification';
import { VerificationImpl } from "./verification-impl";

/**
 * VerificationImpl provides methods for verifying data integrity
 * through checksum validation. Extends BaseModel to implement the
 * PrimeOS Model interface pattern.
 */
export function createVerification(options: VerificationOptions = {}): VerificationModelInterface {
  return new VerificationImpl(options);
}

/**
 * Create and initialize a verification module in a single step
 */
export async function createAndInitializeVerification(
  options: VerificationOptions = {}
): Promise<VerificationModelInterface> {
  const instance = createVerification(options);
  const result = await instance.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize verification module: ${result.error}`);
  }
  
  return instance;
}

// Export the verification status enum
export { VerificationStatus };

// Create default instance with standard options
const defaultVerification = createVerification();

// Export standalone verification functions
export function verifyValue(
  value: bigint,
  primeRegistry: PrimeRegistryForVerification
): VerificationResult {
  return defaultVerification.verifyValue(value, primeRegistry);
}

export async function verifyValueWithRetry(
  value: bigint,
  primeRegistry: PrimeRegistryForVerification,
  retryOptions?: RetryOptions
): Promise<VerificationResult> {
  return defaultVerification.verifyValueWithRetry(value, primeRegistry, retryOptions);
}

// Export batch verification functions
export function verifyValues(
  values: bigint[],
  primeRegistry: PrimeRegistryForVerification
): VerificationResult[] {
  return defaultVerification.verifyValues(values, primeRegistry);
}

export async function verifyValuesWithRetry(
  values: bigint[],
  primeRegistry: PrimeRegistryForVerification,
  retryOptions?: RetryOptions
): Promise<VerificationResult[]> {
  return defaultVerification.verifyValuesWithRetry(values, primeRegistry, retryOptions);
}

// Export optimized verifier creators for performance-critical applications
export function createOptimizedVerifier(
  primeRegistry: PrimeRegistryForVerification
): (value: bigint) => boolean {
  return defaultVerification.createOptimizedVerifier(primeRegistry);
}

export function createOptimizedVerifierWithRetry(
  primeRegistry: PrimeRegistryForVerification,
  retryOptions?: RetryOptions
): (value: bigint) => Promise<boolean> {
  return defaultVerification.createOptimizedVerifierWithRetry(primeRegistry, retryOptions);
}

// Export utility functions
export function getStatus(): VerificationStatus {
  return defaultVerification.getStatus();
}

export function getResults(): VerificationResult[] {
  return defaultVerification.getResults();
}

export function resetVerification(): void {
  return defaultVerification.resetVerification();
}

export function clearCache(): void {
  return defaultVerification.clearCache();
}

// Export error handling functions
export function getErrorDetails(error: Error): Record<string, any> {
  return defaultVerification.getErrorDetails(error);
}

export function logError(error: Error, context?: Record<string, any>): void {
  return defaultVerification.logError(error, context);
}

// Export error types and creators
export {
  VerificationError,
  ValidationError,
  ChecksumMismatchError,
  PrimeRegistryError,
  CacheError,
  TransientError,
  createValidationError,
  createChecksumMismatchError,
  createPrimeRegistryError,
  createCacheError,
  createTransientError,
  retryWithBackoff
};

// Export type definitions
export * from './types';

// Export validation module
export * from './validation';

// Export resilience module
export * from './resilience';

// Export cache module
export * from './cache';

// Export metrics module
export * from './metrics';

// Export events module
export * from './events';
