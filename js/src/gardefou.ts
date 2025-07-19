/**
 * Main GardeFou class for protecting API calls
 */

import { Profile } from './profile';
import { ViolationHandler } from './types';

export class GardeFou {
  private _profile: Profile;

  constructor(options: {
    profile?: Profile;
    max_calls?: number;
    on_violation?: ViolationHandler;
    on_violation_max_calls?: ViolationHandler;
    on_violation_duplicate_call?: ViolationHandler;
  } = {}) {
    if (options.profile) {
      this._profile = options.profile;
    } else {
      // Create profile from remaining options
      const { profile, ...profileOptions } = options;
      this._profile = new Profile(profileOptions);
    }
  }

  /**
   * Execute a function with garde-fou protection
   * @param fn Function to execute
   * @param args Arguments to pass to the function
   * @returns Result of the function call
   */
  call<T extends (...args: any[]) => any>(fn: T, ...args: Parameters<T>): ReturnType<T> {
    // Run profile checks
    this._profile.check(fn.name, args, {});

    // Execute the function
    return fn(...args);
  }

  /**
   * Execute an async function with garde-fou protection
   * @param fn Async function to execute
   * @param args Arguments to pass to the function
   * @returns Promise with the result of the function call
   */
  async callAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    ...args: Parameters<T>
  ): Promise<Awaited<ReturnType<T>>> {
    // Run profile checks
    this._profile.check(fn.name, args, {});

    // Execute the async function
    return await fn(...args);
  }

  /**
   * Callable interface - allows using guard(fn, ...args) syntax
   */
  __call__<T extends (...args: any[]) => any>(fn: T, ...args: Parameters<T>): ReturnType<T> {
    return this.call(fn, ...args);
  }
}