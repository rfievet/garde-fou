# garde-fou

[![Python Tests](https://github.com/rfievet/garde-fou/actions/workflows/python-test.yml/badge.svg)](https://github.com/rfievet/garde-fou/actions/workflows/python-test.yml)
[![npm version](https://badge.fury.io/js/garde-fou.svg)](https://badge.fury.io/js/garde-fou)

**garde-fou** is a multi-language toolkit for building protective wrappers around paid API clients. The goal is to make it easy to enforce usage quotas, rate limits, and duplicate detection across different programming languages.

## Features

- **Call counting** - Set maximum number of calls and get warnings or exceptions when exceeded
- **Duplicate detection** - Detect and handle repeated identical API calls  
- **Flexible violation handling** - Choose to warn, raise exceptions, or use custom handlers
- **Configuration support** - Load settings from JSON/YAML files or set programmatically
- **Async support** - Works with both synchronous and asynchronous functions
- **Multi-language support** - Consistent API across Python, JavaScript/TypeScript, and Ruby

## Quick Start

### Python
```bash
pip install garde-fou
```

```python
from gardefou import GardeFou

guard = GardeFou(max_calls=5, on_violation_max_calls="warn")
result = guard(your_api_function, "your", "arguments")
```

### JavaScript/TypeScript
```bash
npm install garde-fou
```

```typescript
import { GardeFou } from 'garde-fou';

const guard = new GardeFou({ max_calls: 5, on_violation_max_calls: 'warn' });
const result = guard.call(yourApiFunction, "your", "arguments");

// For async functions
const asyncResult = await guard.callAsync(yourAsyncApiFunction, "args");
```

## Repository Layout

- **[python/](python/)** – ✅ **Ready!** Full Python package published to PyPI
- **[js/](js/)** – ✅ **Ready!** TypeScript/JavaScript package with full type support
- **[ruby/](ruby/)** – 🚧 Ruby gem (in development)

## Status

- **Python**: ✅ Complete and published to PyPI
- **JavaScript/TypeScript**: ✅ Complete with TypeScript support and comprehensive test suite
- **Ruby**: 🚧 Planned

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
