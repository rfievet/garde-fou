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
      const guard = GardeFou();
      
      expect(guard(add, 1, 2)).toBe(3);
      expect(guard(add, 3, 4)).toBe(7);
      expect(guard(add, 5, 6)).toBe(11);
    });

    test('should work with explicit call method too', () => {
      const guard = GardeFou();
      
      expect(guard.call(add, 1, 2)).toBe(3);
      expect(guard.call(add, 3, 4)).toBe(7);
    });

    test('should enforce max_calls limit with raise', () => {
      const guard = GardeFou({ max_calls: 2, on_violation_max_calls: 'raise' });
      
      expect(guard(add, 1, 2)).toBe(3);
      expect(guard(add, 3, 4)).toBe(7);
      
      expect(() => guard(add, 5, 6)).toThrow(QuotaExceededError);
    });

    test('should enforce max_calls limit with warn', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const guard = GardeFou({ max_calls: 1, on_violation_max_calls: 'warn' });
      
      expect(guard(add, 1, 2)).toBe(3);
      expect(guard(add, 3, 4)).toBe(7); // Should still return result
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('call quota exceeded')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Calling syntax compatibility', () => {
    test('direct call and .call() method should behave identically', () => {
      const guard = GardeFou({ max_calls: 3, on_violation_max_calls: 'raise' });
      
      // Both should work and share the same call count
      expect(guard(add, 1, 1)).toBe(2);
      expect(guard.call(add, 2, 2)).toBe(4);
      expect(guard(add, 3, 3)).toBe(6);
      
      // Both should trigger the same violation
      expect(() => guard.call(add, 4, 4)).toThrow(QuotaExceededError);
      expect(() => guard(add, 5, 5)).toThrow(QuotaExceededError);
    });

    test('should maintain call count across different calling styles', () => {
      const guard = GardeFou({ max_calls: 5 });
      
      guard(add, 1, 1);           // Call 1
      guard.call(add, 2, 2);      // Call 2
      guard(add, 3, 3);           // Call 3
      
      expect(guard.profile.call_count).toBe(3);
    });

    test('duplicate detection should work across calling styles', () => {
      const guard = GardeFou({ on_violation_duplicate_call: 'raise' });
      
      guard(add, 1, 2);
      expect(() => guard.call(add, 1, 2)).toThrow(QuotaExceededError);
    });
  });

  describe('Duplicate detection', () => {
    test('should detect duplicate calls with raise', () => {
      const guard = GardeFou({ on_violation_duplicate_call: 'raise' });
      
      expect(guard(add, 1, 2)).toBe(3);
      expect(() => guard(add, 1, 2)).toThrow(QuotaExceededError);
    });

    test('should detect duplicate calls with warn', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const guard = GardeFou({ on_violation_duplicate_call: 'warn' });
      
      expect(guard(add, 1, 2)).toBe(3);
      expect(guard(add, 1, 2)).toBe(3); // Should still return result
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('duplicate call detected')
      );
      
      consoleSpy.mockRestore();
    });

    test('should allow different calls', () => {
      const guard = GardeFou({ on_violation_duplicate_call: 'raise' });
      
      expect(guard(add, 1, 2)).toBe(3);
      expect(guard(add, 2, 3)).toBe(5);
      expect(guard(add, 3, 4)).toBe(7);
    });
  });

  describe('Async support', () => {
    test('should work with async functions', async () => {
      const guard = GardeFou({ max_calls: 2 });
      
      expect(await guard.callAsync(multiply, 2, 3)).toBe(6);
      expect(await guard.callAsync(multiply, 3, 4)).toBe(12);
      
      await expect(guard.callAsync(multiply, 4, 5)).rejects.toThrow(QuotaExceededError);
    });

    test('should detect async duplicate calls', async () => {
      const guard = GardeFou({ on_violation_duplicate_call: 'raise' });
      
      expect(await guard.callAsync(multiply, 2, 3)).toBe(6);
      await expect(guard.callAsync(multiply, 2, 3)).rejects.toThrow(QuotaExceededError);
    });

    test('async and sync calls should share the same quota', async () => {
      const guard = GardeFou({ max_calls: 2, on_violation_max_calls: 'raise' });
      
      // Mix sync and async calls
      guard(add, 1, 2);                                    // Call 1 (sync)
      expect(await guard.callAsync(multiply, 2, 3)).toBe(6); // Call 2 (async)
      
      // Third call should fail regardless of type
      expect(() => guard(add, 3, 4)).toThrow(QuotaExceededError);
      await expect(guard.callAsync(multiply, 3, 4)).rejects.toThrow(QuotaExceededError);
    });

    test('should handle mixed sync/async duplicate detection', async () => {
      const guard = GardeFou({ on_violation_duplicate_call: 'raise' });
      
      // Note: sync and async versions of same function are different signatures
      guard(add, 1, 2);
      await guard.callAsync(multiply, 2, 3);
      
      // These should be detected as duplicates
      expect(() => guard(add, 1, 2)).toThrow(QuotaExceededError);
      await expect(guard.callAsync(multiply, 2, 3)).rejects.toThrow(QuotaExceededError);
    });
  });

  describe('Profile integration', () => {
    test('should accept Profile object', () => {
      const profile = new Profile({ max_calls: 1, on_violation_max_calls: 'raise' });
      const guard = GardeFou({ profile });
      
      expect(guard(add, 1, 2)).toBe(3);
      expect(() => guard(add, 3, 4)).toThrow(QuotaExceededError);
    });

    test('should use custom callback handler', () => {
      const mockCallback = jest.fn();
      const guard = GardeFou({ 
        max_calls: 1, 
        on_violation_max_calls: mockCallback 
      });
      
      expect(guard(add, 1, 2)).toBe(3);
      guard(add, 3, 4); // Should trigger callback
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    test('should expose profile for inspection', () => {
      const guard = GardeFou({ max_calls: 5 });
      
      expect(guard.profile.max_calls).toBe(5);
      expect(guard.profile.call_count).toBe(0);
      
      guard(add, 1, 2);
      expect(guard.profile.call_count).toBe(1);
    });
  });

  describe('Real-world usage patterns', () => {
    test('should work with OpenAI-style API calls', () => {
      // Mock OpenAI-style function
      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockReturnValue({ choices: [{ message: { content: 'Hello!' } }] })
          }
        }
      };

      const guard = GardeFou({ max_calls: 2, on_violation_max_calls: 'warn' });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Both calling styles should work
      const result1 = guard(mockOpenAI.chat.completions.create, { messages: [{ role: 'user', content: 'Hi' }] });
      const result2 = guard.call(mockOpenAI.chat.completions.create, { messages: [{ role: 'user', content: 'Hello' }] });
      const result3 = guard(mockOpenAI.chat.completions.create, { messages: [{ role: 'user', content: 'Hey' }] });

      expect(result1.choices[0].message.content).toBe('Hello!');
      expect(result2.choices[0].message.content).toBe('Hello!');
      expect(result3.choices[0].message.content).toBe('Hello!');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('call quota exceeded'));

      consoleSpy.mockRestore();
    });

    test('should handle function with complex arguments', () => {
      const complexApiCall = jest.fn((config, options, callback) => {
        callback(null, `Processed ${config.query} with ${options.model}`);
        return 'success';
      });

      const guard = GardeFou({ max_calls: 2 });
      const mockCallback = jest.fn();

      // Test both calling styles with complex arguments
      const result1 = guard(complexApiCall, 
        { query: 'test1', temperature: 0.7 }, 
        { model: 'gpt-4', max_tokens: 100 }, 
        mockCallback
      );

      const result2 = guard.call(complexApiCall,
        { query: 'test2', temperature: 0.8 },
        { model: 'gpt-3.5', max_tokens: 150 },
        mockCallback
      );

      expect(result1).toBe('success');
      expect(result2).toBe('success');
      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenCalledWith(null, 'Processed test1 with gpt-4');
      expect(mockCallback).toHaveBeenCalledWith(null, 'Processed test2 with gpt-3.5');
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
