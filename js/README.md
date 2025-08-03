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

const guard = GardeFou({ max_calls: 5, on_violation_max_calls: 'warn' });

// Two equivalent ways to call your protected function:

// 1. Direct call (Python-like syntax) - RECOMMENDED
const result = guard(yourApiFunction, "your", "arguments");

// 2. Explicit method call
const result2 = guard.call(yourApiFunction, "your", "arguments");

// For async functions, use callAsync method
const asyncResult = await guard.callAsync(yourAsyncApiFunction, "args");
```

## Calling Patterns

garde-fou supports two calling patterns that work identically:

### Pattern 1: Direct Call (Recommended)
```typescript
const guard = GardeFou({ max_calls: 3 });

// Call guard directly like a function (same as Python)
const result = guard(apiFunction, param1, param2);
```

### Pattern 2: Explicit Method Call
```typescript
const guard = GardeFou({ max_calls: 3 });

// Use explicit .call() method
const result = guard.call(apiFunction, param1, param2);
```

**Both patterns:**
- Share the same call count and quota
- Work with duplicate detection
- Have identical behavior and performance

## Usage Examples

### Basic Call Limiting
```typescript
import { GardeFou, QuotaExceededError } from 'garde-fou';

// Create a guard with a 3-call limit
const guard = GardeFou({ max_calls: 3, on_violation_max_calls: 'raise' });

try {
  // Using direct call syntax (recommended)
  guard(apiCall, 'query 1');
  guard(apiCall, 'query 2'); 
  guard(apiCall, 'query 3');
  guard(apiCall, 'query 4'); // This will throw!
} catch (error) {
  if (error instanceof QuotaExceededError) {
    console.log('Call limit exceeded!');
  }
}

// Alternative: using explicit method calls
try {
  guard.call(apiCall, 'query 1');
  guard.call(apiCall, 'query 2');
  guard.call(apiCall, 'query 3'); 
  guard.call(apiCall, 'query 4'); // This will also throw!
} catch (error) {
  console.log('Same behavior with .call()');
}
```

### Duplicate Call Detection
```typescript
// Warn on duplicate calls
const guard = GardeFou({ on_violation_duplicate_call: 'warn' });

// Direct call syntax
guard(apiCall, 'hello');  // First call - OK
guard(apiCall, 'hello');  // Duplicate - Warning logged
guard(apiCall, 'world');  // Different call - OK

// Explicit method syntax (works identically)
guard.call(apiCall, 'hello');  // Also detected as duplicate!
guard.call(apiCall, 'world');  // Different call - OK
```

### Async Function Protection
```typescript
const guard = GardeFou({ max_calls: 3, on_violation_max_calls: 'raise' });

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

const guard = GardeFou({ 
  max_calls: 5, 
  on_violation_max_calls: customHandler 
});

// Both calling styles work with custom handlers
guard(apiCall, 'test');      // Direct call
guard.call(apiCall, 'test'); // Explicit method call
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

## Real-World Examples

### OpenAI API Protection
```typescript
import OpenAI from 'openai';
import { GardeFou } from 'garde-fou';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const guard = GardeFou({ 
  max_calls: 100, 
  on_violation_max_calls: 'warn',
  on_violation_duplicate_call: 'warn'
});

// Before: Direct API call
// const response = await openai.chat.completions.create({
//   model: 'gpt-4',
//   messages: [{ role: 'user', content: 'Hello!' }]
// });

// After: Protected API call (choose your preferred syntax)

// Option 1: Direct call (Python-like)
const response = await guard.callAsync(openai.chat.completions.create, {
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }]
});

// Option 2: Explicit method call
const response2 = await guard.callAsync(openai.chat.completions.create, {
  model: 'gpt-4', 
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

### Multiple API Services
```typescript
const guard = GardeFou({ max_calls: 50 });

// Protect different APIs with the same guard
const openaiResult = guard(openai.chat.completions.create, { /* config */ });
const anthropicResult = guard(anthropic.messages.create, { /* config */ });
const cohereResult = guard.call(cohere.generate, { /* config */ });

console.log(`Total API calls made: ${guard.profile.call_count}`);
```

## How It Works

garde-fou works by wrapping your function calls. Instead of calling your API function directly, you call it through the guard:

```typescript
// Before
const result = openai.chat.completions.create({ messages: [...] });

// After - choose your preferred syntax:
const guard = GardeFou({ max_calls: 10 });

// Option 1: Direct call (recommended)
const result = guard(openai.chat.completions.create, { messages: [...] });

// Option 2: Explicit method call  
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