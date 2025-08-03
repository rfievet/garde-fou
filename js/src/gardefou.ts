/**
 * Main GardeFou implementation for protecting API calls
 */

import { Profile } from './profile';
import { ViolationHandler } from './types';

interface GardefouOptions {
  profile?: Profile;
  max_calls?: number;
  on_violation?: ViolationHandler;
  on_violation_max_calls?: ViolationHandler;
  on_violation_duplicate_call?: ViolationHandler;
}

/**
 * Creates a callable guard function that can be used like: guard(fn, ...args)
 * This mimics the Python behavior where you can call guard directly
 */
export function GardeFou(options: GardefouOptions = {}) {
  // Create the profile
  const profile = options.profile || new Profile(options);

  // Create the main callable function
  function guard<T extends (...args: any[]) => any>(fn: T, ...args: Parameters<T>): ReturnType<T> {
    // Run profile checks
    profile.check(fn.name, args, {});

    // Execute the function
    return fn(...args);
  }

  // Add async support as a method
  guard.callAsync = async function<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    ...args: Parameters<T>
  ): Promise<Awaited<ReturnType<T>>> {
    // Run profile checks
    profile.check(fn.name, args, {});

    // Execute the async function
    return await fn(...args);
  };

  // Add explicit call method for those who prefer it
  guard.call = function<T extends (...args: any[]) => any>(fn: T, ...args: Parameters<T>): ReturnType<T> {
    return guard(fn, ...args);
  };

  // Expose the profile for inspection
  guard.profile = profile;

  return guard;
}