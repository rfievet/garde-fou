/**
 * Comprehensive tests for garde-fou TypeScript implementation
 */

import { GardeFou, Profile, QuotaExceededError } from '../src';

// Mock functions for testing
const add = (a: number, b: number): number => a + b;
const multiply = async (a: number, b: number): Promise<number> => a * b;

describe('GardeFou', () => {
  describe('Basic functionality', () => {
    test('should allow unlimited calls by default', () => {
      const guard = new GardeFou();
      
      expect(guard.call(add, 1, 2)).toBe(3);
      expect(guard.call(add, 3, 4)).toBe(7);
      expect(guard.call(add, 5, 6)).toBe(11);
    });

    test('should enforce max_calls limit with raise', () => {
      const guard = new GardeFou({ max_calls: 2, on_violation_max_calls: 'raise' });
      
      expect(guard.call(add, 1, 2)).toBe(3);
      expect(guard.call(add, 3, 4)).toBe(7);
      
      expect(() => guard.call(add, 5, 6)).toThrow(QuotaExceededError);
    });

    test('should enforce max_calls limit with warn', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const guard = new GardeFou({ max_calls: 1, on_violation_max_calls: 'warn' });
      
      expect(guard.call(add, 1, 2)).toBe(3);
      expect(guard.call(add, 3, 4)).toBe(7); // Should still return result
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('call quota exceeded')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Duplicate detection', () => {
    test('should detect duplicate calls with raise', () => {
      const guard = new GardeFou({ on_violation_duplicate_call: 'raise' });
      
      expect(guard.call(add, 1, 2)).toBe(3);
      expect(() => guard.call(add, 1, 2)).toThrow(QuotaExceededError);
    });

    test('should detect duplicate calls with warn', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const guard = new GardeFou({ on_violation_duplicate_call: 'warn' });
      
      expect(guard.call(add, 1, 2)).toBe(3);
      expect(guard.call(add, 1, 2)).toBe(3); // Should still return result
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('duplicate call detected')
      );
      
      consoleSpy.mockRestore();
    });

    test('should allow different calls', () => {
      const guard = new GardeFou({ on_violation_duplicate_call: 'raise' });
      
      expect(guard.call(add, 1, 2)).toBe(3);
      expect(guard.call(add, 2, 3)).toBe(5);
      expect(guard.call(add, 3, 4)).toBe(7);
    });
  });

  describe('Async support', () => {
    test('should work with async functions', async () => {
      const guard = new GardeFou({ max_calls: 2 });
      
      expect(await guard.callAsync(multiply, 2, 3)).toBe(6);
      expect(await guard.callAsync(multiply, 3, 4)).toBe(12);
      
      await expect(guard.callAsync(multiply, 4, 5)).rejects.toThrow(QuotaExceededError);
    });

    test('should detect async duplicate calls', async () => {
      const guard = new GardeFou({ on_violation_duplicate_call: 'raise' });
      
      expect(await guard.callAsync(multiply, 2, 3)).toBe(6);
      await expect(guard.callAsync(multiply, 2, 3)).rejects.toThrow(QuotaExceededError);
    });
  });

  describe('Profile integration', () => {
    test('should accept Profile object', () => {
      const profile = new Profile({ max_calls: 1, on_violation_max_calls: 'raise' });
      const guard = new GardeFou({ profile });
      
      expect(guard.call(add, 1, 2)).toBe(3);
      expect(() => guard.call(add, 3, 4)).toThrow(QuotaExceededError);
    });

    test('should use custom callback handler', () => {
      const mockCallback = jest.fn();
      const guard = new GardeFou({ 
        max_calls: 1, 
        on_violation_max_calls: mockCallback 
      });
      
      expect(guard.call(add, 1, 2)).toBe(3);
      guard.call(add, 3, 4); // Should trigger callback
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Profile', () => {
  test('should load from config object', () => {
    const config = { max_calls: 5, on_violation: 'warn' as const };
    const profile = new Profile({ config });
    
    expect(profile.max_calls).toBe(5);
    expect(profile.on_violation).toBe('warn');
  });

  test('should override config with explicit options', () => {
    const config = { max_calls: 5 };
    const profile = new Profile({ 
      config, 
      max_calls: 10,
      on_violation: 'raise' as const
    });
    
    expect(profile.max_calls).toBe(10);
    expect(profile.on_violation).toBe('raise');
  });
});

describe('QuotaExceededError', () => {
  test('should be instance of Error', () => {
    const error = new QuotaExceededError('test message');
    
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('QuotaExceededError');
    expect(error.message).toBe('test message');
  });
});
