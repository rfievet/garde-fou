/**
 * Type definitions for garde-fou
 */

import { Profile } from './profile';

export type ViolationHandler = 'warn' | 'raise' | ((profile: any) => void);

export interface ProfileConfig {
  max_calls?: number;
  on_violation?: ViolationHandler;
  on_violation_max_calls?: ViolationHandler;
  on_violation_duplicate_call?: ViolationHandler;
}

export type ConfigSource = string | ProfileConfig;

// Type for the callable guard function
export interface GuardFunction {
  <T extends (...args: any[]) => any>(fn: T, ...args: Parameters<T>): ReturnType<T>;
  callAsync<T extends (...args: any[]) => Promise<any>>(fn: T, ...args: Parameters<T>): Promise<Awaited<ReturnType<T>>>;
  call<T extends (...args: any[]) => any>(fn: T, ...args: Parameters<T>): ReturnType<T>;
  profile: Profile;
}