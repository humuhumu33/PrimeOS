/**
 * Modular Arithmetic Module Tests
 * =============================
 * 
 * Test suite for the modular arithmetic precision module.
 */

import { 
  mod,
  modPow,
  modInverse,
  modMul,
  extendedGcd,
  gcd,
  lcm,
  clearCache,
  createModularOperations,
  createAndInitializeModularOperations,
  MODULAR_CONSTANTS,
  ModFunction,
  ModPowFunction,
  ModInverseFunction,
  ModMulFunction
} from './index';

describe('Modular Arithmetic Module', () => {
  describe('mod function', () => {
    test('standard modulo operations', () => {
      // Basic positive cases
      expect(mod(10, 3)).toBe(BigInt(1));
      expect(mod(BigInt(10), BigInt(3))).toBe(BigInt(1));
      expect(mod(10, BigInt(3))).toBe(BigInt(1));
      expect(mod(BigInt(10), 3)).toBe(BigInt(1));
      
      // Zero modulus should throw
      expect(() => mod(5, 0)).toThrow();
      expect(() => mod(BigInt(5), BigInt(0))).toThrow();
    });

describe('Model Interface', () => {
  test('createModularOperations returns object implementing ModelInterface', () => {
    const modular = createModularOperations();
    
    expect(modular.initialize).toBeInstanceOf(Function);
    expect(modular.process).toBeInstanceOf(Function);
    expect(modular.reset).toBeInstanceOf(Function);
    expect(modular.terminate).toBeInstanceOf(Function);
    expect(modular.getState).toBeInstanceOf(Function);
  });
  
  test('createAndInitializeModularOperations initializes the module', async () => {
    const modular = await createAndInitializeModularOperations();
    
    expect(modular.getState().lifecycle).toBe('ready');
    
    // Clean up
    await modular.terminate();
  });
  
  test('process method handles operations correctly', async () => {
    const modular = await createAndInitializeModularOperations();
    
    // Test mod operation
    const modResult = await modular.process({
      operation: 'mod',
      params: [10, 3]
    });
    
    expect(modResult.data).toBe(BigInt(1));
    
    // Test modPow operation
    const powResult = await modular.process({
      operation: 'modPow',
      params: [2, 10, 1000]
    });
    
    expect(powResult.data).toBe(BigInt(24));
    
    // Clean up
    await modular.terminate();
  });
  
  test('getState returns correct state information', async () => {
    const modular = await createAndInitializeModularOperations();
    
    // Perform some operations to update state
    modular.modInverse(3, 11);
    modular.gcd(BigInt(48), BigInt(18));
    
    // Get state
    const state = modular.getState();
    
    // Verify state properties
    expect(state.lifecycle).toBe('ready');
    expect(state.config).toBeDefined();
    expect(state.cache).toBeDefined();
    
    // Clean up
    await modular.terminate();
  });
});
    
    test('Python-compatible modulo with negative numbers', () => {
      // Negative numbers should behave like Python
      expect(mod(-5, 3)).toBe(BigInt(1));  // In JS: -5 % 3 = -2
      expect(mod(-BigInt(5), BigInt(3))).toBe(BigInt(1));
      expect(mod(-15, 4)).toBe(BigInt(1)); // In JS: -15 % 4 = -3
      expect(mod(-BigInt(15), BigInt(4))).toBe(BigInt(1));
    });
    
    test('Edge cases', () => {
      // Modulo with large numbers
      expect(mod(BigInt(9007199254740991), BigInt(10))).toBe(BigInt(1)); // MAX_SAFE_INTEGER % 10
      
      // Zero modulo
      expect(mod(0, 5)).toBe(BigInt(0));
      expect(mod(BigInt(0), BigInt(5))).toBe(BigInt(0));
      
      // Negative modulus should be handled
      expect(mod(10, -3)).toBe(BigInt(1));  // Should normalize the modulus
      expect(mod(BigInt(10), -BigInt(3))).toBe(BigInt(1));
    });
  });
  
  describe('modPow function', () => {
    test('basic modular exponentiation', () => {
      expect(modPow(2, 10, 1000)).toBe(BigInt(24));  // 2^10 % 1000 = 1024 % 1000 = 24
      expect(modPow(BigInt(2), BigInt(10), BigInt(1000))).toBe(BigInt(24));
      expect(modPow(3, 4, 10)).toBe(BigInt(1));     // 3^4 % 10 = 81 % 10 = 1
      expect(modPow(BigInt(3), BigInt(4), BigInt(10))).toBe(BigInt(1));
    });
    
    test('handles negative exponents', () => {
      // 2^(-1) mod 11 = 6 (inverse of 2 modulo 11)
      expect(modPow(2, -1, 11)).toBe(BigInt(6));
      expect(modPow(BigInt(2), -BigInt(1), BigInt(11))).toBe(BigInt(6));
    });
    
    test('edge cases', () => {
      // Modulo 1 always returns 0
      expect(modPow(5, 20, 1)).toBe(BigInt(0));
      expect(modPow(BigInt(5), BigInt(20), BigInt(1))).toBe(BigInt(0));
      
      // Power of 0 returns 1
      expect(modPow(5, 0, 7)).toBe(BigInt(1));
      expect(modPow(BigInt(5), BigInt(0), BigInt(7))).toBe(BigInt(1));
      
      // Base of 0 returns 0
      expect(modPow(0, 5, 7)).toBe(BigInt(0));
      expect(modPow(BigInt(0), BigInt(5), BigInt(7))).toBe(BigInt(0));
    });
    
    test('works with large numbers', () => {
      // Use large exponent that would overflow without modular reduction
      expect(modPow(BigInt(2), BigInt(100), BigInt(1000))).toBe(BigInt(376));  // 2^100 % 1000 = 376
    });
  });
  
  describe('modInverse function', () => {
    test('basic modular inverse', () => {
      expect(modInverse(3, 11)).toBe(BigInt(4));  // 3*4 = 12 ≡ 1 (mod 11)
      expect(modInverse(BigInt(3), BigInt(11))).toBe(BigInt(4));
      
      expect(modInverse(7, 20)).toBe(BigInt(3));  // 7*3 = 21 ≡ 1 (mod 20)
      expect(modInverse(BigInt(7), BigInt(20))).toBe(BigInt(3));
    });
    
    test('handles error cases', () => {
      // No modular inverse exists when gcd(a, m) > 1
      expect(() => modInverse(2, 4)).toThrow();  // gcd(2, 4) = 2
      expect(() => modInverse(BigInt(2), BigInt(4))).toThrow();
      
      // Zero has no modular inverse
      expect(() => modInverse(0, 5)).toThrow();
      expect(() => modInverse(BigInt(0), BigInt(5))).toThrow();
      
      // Cannot find inverse with modulo 0
      expect(() => modInverse(3, 0)).toThrow();
      expect(() => modInverse(BigInt(3), BigInt(0))).toThrow();
    });
    
    test('works with large numbers', () => {
      expect(modInverse(BigInt(17), BigInt(101))).toBe(BigInt(6));  // 17*6 = 102 ≡ 1 (mod 101)
    });
  });
  
  describe('modMul function', () => {
    test('basic modular multiplication', () => {
      expect(modMul(7, 8, 13)).toBe(BigInt(4));  // 7*8 = 56 ≡ 4 (mod 13)
      expect(modMul(BigInt(7), BigInt(8), BigInt(13))).toBe(BigInt(4));
    });
    
    test('handles overflow cases', () => {
      // Large numbers that would overflow standard multiplication
      const a = BigInt(9007199254740990);  // Close to MAX_SAFE_INTEGER
      const b = BigInt(9007199254740990);
      const m = BigInt(97);
      
      // (a * b) % m would overflow without special handling
      expect(modMul(a, b, m)).toBe(BigInt(27));
    });
    
    test('handles negative operands', () => {
      expect(modMul(-7, 8, 13)).toBe(BigInt(9));  // -7*8 = -56 ≡ 9 (mod 13)
      expect(modMul(7, -8, 13)).toBe(BigInt(9));  // 7*(-8) = -56 ≡ 9 (mod 13)
      expect(modMul(-7, -8, 13)).toBe(BigInt(4)); // (-7)*(-8) = 56 ≡ 4 (mod 13)
    });
  });
  
  describe('extendedGcd function', () => {
    test('calculates correct Bézout coefficients', () => {
      // gcd(35, 15) = 5 = 35*(-1) + 15*3
      const [g, x, y] = extendedGcd(BigInt(35), BigInt(15));
      expect(g).toBe(BigInt(5));
      expect(BigInt(35) * x + BigInt(15) * y).toBe(BigInt(5));
      
      // Another example: gcd(101, 13) = 1 = 101*4 + 13*(-31)
      const [g2, x2, y2] = extendedGcd(BigInt(101), BigInt(13));
      expect(g2).toBe(BigInt(1));
      expect(BigInt(101) * x2 + BigInt(13) * y2).toBe(BigInt(1));
    });
    
    test('works with one zero input', () => {
      // gcd(0, 5) = 5, with coefficients (0, 1)
      const [g, x, y] = extendedGcd(BigInt(0), BigInt(5));
      expect(g).toBe(BigInt(5));
      expect(x).toBe(BigInt(0));
      expect(y).toBe(BigInt(1));
      
      // gcd(7, 0) = 7, with coefficients (1, 0)
      const [g2, x2, y2] = extendedGcd(BigInt(7), BigInt(0));
      expect(g2).toBe(BigInt(7));
      expect(x2).toBe(BigInt(1));
      expect(y2).toBe(BigInt(0));
    });
  });
  
  describe('gcd function', () => {
    test('calculates correct greatest common divisor', () => {
      expect(gcd(BigInt(48), BigInt(18))).toBe(BigInt(6));
      expect(gcd(BigInt(101), BigInt(13))).toBe(BigInt(1));
      expect(gcd(BigInt(0), BigInt(5))).toBe(BigInt(5));
      expect(gcd(BigInt(5), BigInt(0))).toBe(BigInt(5));
    });
    
    test('handles negative numbers', () => {
      expect(gcd(-BigInt(48), BigInt(18))).toBe(BigInt(6));
      expect(gcd(BigInt(48), -BigInt(18))).toBe(BigInt(6));
      expect(gcd(-BigInt(48), -BigInt(18))).toBe(BigInt(6));
    });
  });
  
  describe('lcm function', () => {
    test('calculates correct least common multiple', () => {
      expect(lcm(BigInt(4), BigInt(6))).toBe(BigInt(12));
      expect(lcm(BigInt(15), BigInt(20))).toBe(BigInt(60));
      expect(lcm(BigInt(7), BigInt(11))).toBe(BigInt(77));
    });
    
    test('handles zero inputs', () => {
      expect(lcm(BigInt(0), BigInt(5))).toBe(BigInt(0));
      expect(lcm(BigInt(5), BigInt(0))).toBe(BigInt(0));
      expect(lcm(BigInt(0), BigInt(0))).toBe(BigInt(0));
    });
  });
  
  describe('Factory Function', () => {
    test('createModularOperations returns object with all expected methods', () => {
      const operations = createModularOperations();
      
      expect(operations.mod).toBeInstanceOf(Function);
      expect(operations.modPow).toBeInstanceOf(Function);
      expect(operations.modInverse).toBeInstanceOf(Function);
      expect(operations.modMul).toBeInstanceOf(Function);
      expect(operations.extendedGcd).toBeInstanceOf(Function);
      expect(operations.gcd).toBeInstanceOf(Function);
      expect(operations.lcm).toBeInstanceOf(Function);
      expect(operations.clearCache).toBeInstanceOf(Function);
    });
    
    test('createModularOperations with custom options', () => {
      const operations = createModularOperations({
        pythonCompatible: false,
        useCache: false,
        useOptimized: false,
        nativeThreshold: 32
      });
      
      // JavaScript modulo behavior (not Python compatible)
      expect(operations.mod(-5, 3)).toBe(-BigInt(2));
      
      // Operation should still work correctly
      expect(operations.modPow(2, 10, 1000)).toBe(BigInt(24));
    });
  });
  
  describe('Constants', () => {
    test('MODULAR_CONSTANTS are defined', () => {
      expect(MODULAR_CONSTANTS.MAX_NATIVE_BITS).toBe(50);
      expect(MODULAR_CONSTANTS.DEFAULT_CACHE_SIZE).toBe(1000);
      expect(MODULAR_CONSTANTS.MAX_SUPPORTED_BITS).toBe(4096);
    });
  });
  
  describe('Type Safety', () => {
    test('functions return bigint values regardless of input types', () => {
      // Test mod function
      const modResult1: bigint = mod(10, 3);
      const modResult2: bigint = mod(BigInt(10), BigInt(3));
      const modResult3: bigint = mod(10, BigInt(3));
      const modResult4: bigint = mod(BigInt(10), 3);
      
      // Verify types at runtime
      expect(typeof modResult1).toBe('bigint');
      expect(typeof modResult2).toBe('bigint');
      expect(typeof modResult3).toBe('bigint');
      expect(typeof modResult4).toBe('bigint');
      
      // Test modPow function
      const powResult1: bigint = modPow(2, 10, 1000);
      const powResult2: bigint = modPow(BigInt(2), BigInt(10), BigInt(1000));
      
      // Verify types at runtime
      expect(typeof powResult1).toBe('bigint');
      expect(typeof powResult2).toBe('bigint');
      
      // Test modInverse function
      const invResult1: bigint = modInverse(3, 11);
      const invResult2: bigint = modInverse(BigInt(3), BigInt(11));
      
      // Verify types at runtime
      expect(typeof invResult1).toBe('bigint');
      expect(typeof invResult2).toBe('bigint');
      
      // Test modMul function
      const mulResult1: bigint = modMul(7, 8, 13);
      const mulResult2: bigint = modMul(BigInt(7), BigInt(8), BigInt(13));
      
      // Verify types at runtime
      expect(typeof mulResult1).toBe('bigint');
      expect(typeof mulResult2).toBe('bigint');
    });
    
    test('function signatures enforce correct return types', () => {
      // These type assertions verify that the function signatures
      // correctly specify bigint as the return type
      
      // Create type variables with explicit function types
      const modFunc: ModFunction = mod;
      const powFunc: ModPowFunction = modPow;
      const invFunc: ModInverseFunction = modInverse;
      const mulFunc: ModMulFunction = modMul;
      
      // If these assignments compile, the types are correct
      expect(modFunc).toBe(mod);
      expect(powFunc).toBe(modPow);
      expect(invFunc).toBe(modInverse);
      expect(mulFunc).toBe(modMul);
    });
  });
  
  describe('Cache Management', () => {
    test('clearCache function clears internal caches', () => {
      // First use a function that would populate the cache
      modInverse(3, 11);
      modInverse(7, 20);
      
      // Clear the cache
      clearCache();
      
      // The operations should still work after clearing the cache
      expect(modInverse(3, 11)).toBe(BigInt(4));
      expect(modInverse(7, 20)).toBe(BigInt(3));
    });
    
    test('custom instance can clear its own cache', () => {
      const operations = createModularOperations({ useCache: true });
      
      // Use functions to populate cache
      operations.gcd(BigInt(48), BigInt(18));
      operations.modInverse(3, 11);
      
      // Clear the cache
      operations.clearCache();
      
      // Operations should still work
      expect(operations.gcd(BigInt(48), BigInt(18))).toBe(BigInt(6));
      expect(operations.modInverse(3, 11)).toBe(BigInt(4));
    });
  });
  
  describe('Debug Mode and Strict Validation', () => {
    test('debug mode can be enabled without affecting results', () => {
      const debugOps = createModularOperations({ debug: true });
      
      // Results should be the same as without debug mode
      expect(debugOps.mod(10, 3)).toBe(BigInt(1));
      expect(debugOps.modPow(2, 10, 1000)).toBe(BigInt(24));
      expect(debugOps.modInverse(3, 11)).toBe(BigInt(4));
      expect(debugOps.gcd(BigInt(48), BigInt(18))).toBe(BigInt(6));
    });
    
    test('strict mode validates operation sizes', () => {
      const strictOps = createModularOperations({ 
        strict: true,
        debug: false
      });
      
      // Normal operations should work
      expect(strictOps.mod(10, 3)).toBe(BigInt(1));
      expect(strictOps.modPow(2, 10, 1000)).toBe(BigInt(24));
      
      // We can't easily test the size limits without exceeding memory constraints
      // in the test environment, but we can confirm the function still works in strict mode
    });
  });
});
