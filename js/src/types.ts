/**
 * Type definitions for garde-fou
 */

export type ViolationHandler = 'warn' | 'raise' | ((profile: any) => void);

export interface ProfileConfig {
  max_calls?: number;
  on_violation?: ViolationHandler;
  on_violation_max_calls?: ViolationHandler;
  on_violation_duplicate_call?: ViolationHandler;
}

export type ConfigSource = string | ProfileConfig;