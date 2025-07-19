/**
 * Profile class for garde-fou configuration and rule enforcement
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { ViolationHandler, ProfileConfig, ConfigSource } from './types';
import { CallSignature } from './storage';

export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

export class Profile {
  public max_calls: number;
  public on_violation: ViolationHandler;
  public on_violation_max_calls: ViolationHandler;
  public on_violation_duplicate_call: ViolationHandler;
  
  public call_count: number = 0;
  private _call_signatures: Set<string> = new Set();
  private _max_calls_enabled: boolean = false;
  private _dup_enabled: boolean = false;

  constructor(options: {
    config?: ConfigSource;
    max_calls?: number;
    on_violation?: ViolationHandler;
    on_violation_max_calls?: ViolationHandler;
    on_violation_duplicate_call?: ViolationHandler;
  } = {}) {
    // Load base data from file or object
    let data: ProfileConfig = {};
    
    if (typeof options.config === 'string') {
      // Load from file
      const configPath = path.resolve(options.config);
      const content = fs.readFileSync(configPath, 'utf8');
      
      if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
        data = yaml.load(content) as ProfileConfig;
      } else {
        data = JSON.parse(content);
      }
    } else if (typeof options.config === 'object') {
      data = { ...options.config };
    }

    // Override with explicit options
    if (options.max_calls !== undefined) data.max_calls = options.max_calls;
    if (options.on_violation !== undefined) data.on_violation = options.on_violation;
    if (options.on_violation_max_calls !== undefined) data.on_violation_max_calls = options.on_violation_max_calls;
    if (options.on_violation_duplicate_call !== undefined) data.on_violation_duplicate_call = options.on_violation_duplicate_call;

    // Assign settings with defaults
    this.max_calls = data.max_calls ?? -1;
    this.on_violation = data.on_violation ?? 'raise';
    this.on_violation_max_calls = data.on_violation_max_calls ?? this.on_violation;
    this.on_violation_duplicate_call = data.on_violation_duplicate_call ?? this.on_violation;

    // Track which rules were explicitly configured
    this._max_calls_enabled = data.max_calls !== undefined && this.max_calls >= 0;
    this._dup_enabled = data.on_violation_duplicate_call !== undefined;
  }

  check(fnName?: string, args: any[] = [], kwargs: Record<string, any> = {}): void {
    if (this._max_calls_enabled) {
      this._checkMaxCall();
    }
    if (this._dup_enabled) {
      this._checkDuplicate(fnName, args, kwargs);
    }
  }

  private _checkMaxCall(): void {
    this.call_count++;
    if (this.call_count > this.max_calls) {
      const msg = `GardeFou: call quota exceeded (${this.call_count}/${this.max_calls})`;
      const handler = this.on_violation_max_calls;
      
      if (handler === 'warn') {
        console.warn(msg);
      } else if (handler === 'raise') {
        throw new QuotaExceededError(msg);
      } else if (typeof handler === 'function') {
        handler(this);
      }
    }
  }

  private _checkDuplicate(fnName?: string, args: any[] = [], kwargs: Record<string, any> = {}): void {
    const signature = new CallSignature(fnName, args, kwargs);
    const sigStr = signature.toString();
    
    if (this._call_signatures.has(sigStr)) {
      const msg = `GardeFou: duplicate call detected for ${fnName} with args ${JSON.stringify(args)} and kwargs ${JSON.stringify(kwargs)}`;
      const handler = this.on_violation_duplicate_call;
      
      if (handler === 'warn') {
        console.warn(msg);
      } else if (handler === 'raise') {
        throw new QuotaExceededError(msg);
      } else if (typeof handler === 'function') {
        handler(this);
      }
    } else {
      this._call_signatures.add(sigStr);
    }
  }
}