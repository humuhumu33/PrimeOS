/**
 * Bit Counting Operations
 * =====================
 * 
 * Implementation of bit counting operations.
 */

import { UtilityOptions } from '../../types';
import { createNegativeInputError } from '../../errors';

/**
 * Create bit counting functions with the specified options
 */
export function createBitCountingFunctions(options: UtilityOptions = {}) {
  // Process options with defaults
  const config = {
    strict: options.strict ?? false
  };
  
  /**
   * Count the number of set bits (1s) in a number
   */
  const countSetBits = (value: bigint | number): number => {
    // Convert to BigInt for consistent handling
    const n = typeof value === 'number' ? BigInt(Math.floor(value)) : value;
    
    // Handle negative numbers by taking absolute value
    const absValue = n < BigInt(0) ? -n : n;
    
    // Count bits
    let count = 0;
    let temp = absValue;
    
    while (temp > BigInt(0)) {
      if (temp & BigInt(1)) count++;
      temp >>= BigInt(1);
    }
    
    return count;
  };
  
  /**
   * Count the number of leading zeros in the binary representation
   * Assumes a 64-bit representation for consistency
   */
  const leadingZeros = (value: bigint | number): number => {
    // Convert to BigInt for consistent handling
    const n = typeof value === 'number' ? BigInt(Math.floor(value)) : value;
    
    // Handle negative or zero inputs
    if (n <= BigInt(0)) {
      if (config.strict && n < BigInt(0)) {
        throw createNegativeInputError('leadingZeros', n);
      }
      return n === BigInt(0) ? 64 : 0; // Assume 64-bit representation for zero
    }
    
    // Calculate bit length
    let bitLength = 0;
    let temp = n;
    
    while (temp > BigInt(0)) {
      bitLength++;
      temp >>= BigInt(1);
    }
    
    // Leading zeros = 64 - bit length (assuming 64-bit representation)
    return 64 - bitLength;
  };
  
  /**
   * Count the number of trailing zeros in the binary representation
   */
  const trailingZeros = (value: bigint | number): number => {
    // Convert to BigInt for consistent handling
    const n = typeof value === 'number' ? BigInt(Math.floor(value)) : value;
    
    // Handle zero input
    if (n === BigInt(0)) return 64; // Assume 64-bit representation
    
    // Count trailing zeros
    let count = 0;
    let temp = n;
    
    while ((temp & BigInt(1)) === BigInt(0)) {
      count++;
      temp >>= BigInt(1);
    }
    
    return count;
  };
  
  return {
    countSetBits,
    leadingZeros,
    trailingZeros
  };
}
