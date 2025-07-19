# garde-fou (TypeScript/JavaScript)

[![npm version](https://badge.fury.io/js/garde-fou.svg)](https://badge.fury.io/js/garde-fou)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**garde-fou** is a lightweight guard for protecting against accidental over-usage of paid API calls. It provides call counting and duplicate detection to help you avoid unexpected API bills.

## Features

- **Call counting** - Set maximum number of calls and get warnings or exceptions when exceeded
- **Duplicate detection** - Detect and handle repeated identical API calls
- **Flexible violation handling** - Choose to warn, raise exceptions, or use custom handlers
- **Configuration support** - Load settings from JSON/YAML files or set programmatically
- **Async support** - Works with both synchronous and asynchronous functions
- **TypeScript support** - Full TypeScript definitions included

## Installation

```bash
npm install garde-fou
# or
yarn add garde-fou
```

## Quick Start

```typescript
import { GardeFou } from 'garde-fou';

// Protect any function with call limits
const guard = new GardeFou({ max_calls: 5, on_violation_max_calls: 'warn' });

// Instead of: result = expensiveApiCall("query")
// Use: result = guard.call(expensiveApiCall, "query")
const result = guard.call(yourApiFunction, "your", "arguments");
```

## Usage Examples

### Basic Call Limiting
```typescript
import { GardeFou, QuotaExceededError } from 'garde-fou';

// Create a guard with a 3-call limit
const guard = new GardeFou({ max_calls: 3, on_violation_max_calls: 'raise' });

try {
  for (let i = 0; i < 5; i++) {
    const result = guard.call(apiCall, `query ${i}`);
  }
} catch (error) {
  if (error instanceof QuotaExceededError) {
    console.log('Call limit exceeded!');
  }
}
```

### Duplicate Call Detection
```typescript
// Warn on duplicate calls
const guard = new GardeFou({ on_violation_duplicate_call: 'warn' });

guard.call(apiCall, 'hello');  // First call - OK
guard.call(apiCall, 'hello');  // Duplicate - Warning logged
guard.call(apiCall, 'world');  // Different call - OK
```

### Async Function Protection
```typescript
const guard = new GardeFou({ max_calls: 3, on_violation_max_calls: 'raise' });

try {
  const result1 = await guard.callAsync(asyncApiCall, 'query 1');
  const result2 = await guard.callAsync(asyncApiCall, 'query 2');
  const result3 = await guard.callAsync(asyncApiCall, 'query 3');
  const result4 = await guard.callAsync(asyncApiCall, 'query 4'); // Throws
} catch (error) {
  console.log('Async call limit exceeded!');
}
```

### Using Profiles
```typescript
import { Profile } from 'garde-fou';

// Create a profile with multiple rules
const profile = new Profile({
  max_calls: 10,
  on_violation_max_calls: 'raise',
  on_violation_duplicate_call: 'warn'
});

const guard = new GardeFou({ profile });
```

### Configuration Files
```typescript
// Load from JSON/YAML file
const profile = new Profile({ config: 'gardefou.config.json' });
const guard = new GardeFou({ profile });

// Or pass config as object
const config = { max_calls: 5, on_violation_max_calls: 'warn' };
const profile2 = new Profile({ config });
```

### Custom Violation Handlers
```typescript
const customHandler = (profile) => {
  console.log(`Custom violation! Call count: ${profile.call_count}`);
  // Send alert, log to service, etc.
};

const guard = new GardeFou({ 
  max_calls: 5, 
  on_violation_max_calls: customHandler 
});
```

## Configuration Options

- `max_calls`: Maximum number of calls allowed (-1 for unlimited)
- `on_violation_max_calls`: Handler when call limit exceeded (`'warn'`, `'raise'`, or function)
- `on_violation_duplicate_call`: Handler for duplicate calls (`'warn'`, `'raise'`, or function)
- `on_violation`: Default handler for all violations

## API Reference

### GardeFou Class

#### Constructor
```typescript
new GardeFou(options?: {
  profile?: Profile;
  max_calls?: number;
  on_violation?: ViolationHandler;
  on_violation_max_calls?: ViolationHandler;
  on_violation_duplicate_call?: ViolationHandler;
})
```

#### Methods
- `call<T>(fn: T, ...args): ReturnType<T>` - Execute a synchronous function with protection
- `callAsync<T>(fn: T, ...args): Promise<ReturnType<T>>` - Execute an async function with protection

### Profile Class

#### Constructor
```typescript
new Profile(options?: {
  config?: string | ProfileConfig;
  max_calls?: number;
  on_violation?: ViolationHandler;
  on_violation_max_calls?: ViolationHandler;
  on_violation_duplicate_call?: ViolationHandler;
})
```

### Types
```typescript
type ViolationHandler = 'warn' | 'raise' | ((profile: Profile) => void);

interface ProfileConfig {
  max_calls?: number;
  on_violation?: ViolationHandler;
  on_violation_max_calls?: ViolationHandler;
  on_violation_duplicate_call?: ViolationHandler;
}
```

## How It Works

garde-fou works by wrapping your function calls. Instead of calling your API function directly, you call it through the guard:

```typescript
// Before
const result = openai.chat.completions.create({ messages: [...] });

// After  
const guard = new GardeFou({ max_calls: 10 });
const result = guard.call(openai.chat.completions.create, { messages: [...] });
```

The guard tracks calls and enforces your configured rules before executing the actual function.

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run example
npm run build && node examples/example.js
```

## Contributing

This is part of the multi-language garde-fou toolkit. See the main repository for contributing guidelines.

## License

MIT