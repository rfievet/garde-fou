# garde-fou (Python)

[![PyPI version](https://badge.fury.io/py/garde-fou.svg)](https://badge.fury.io/py/garde-fou)
[![Python Tests](https://github.com/rfievet/garde-fou/actions/workflows/python-test.yml/badge.svg)](https://github.com/rfievet/garde-fou/actions/workflows/python-test.yml)
[![Python versions](https://img.shields.io/pypi/pyversions/garde-fou.svg)](https://pypi.org/project/garde-fou/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://pepy.tech/badge/garde-fou)](https://pepy.tech/project/garde-fou)

**garde-fou** is a lightweight guard for protecting against accidental over-usage of paid API calls. It provides call counting and duplicate detection to help you avoid unexpected API bills.

## Features

- **Call counting** - Set maximum number of calls and get warnings or exceptions when exceeded
- **Duplicate detection** - Detect and handle repeated identical API calls
- **Flexible violation handling** - Choose to warn, raise exceptions, or use custom handlers
- **Configuration support** - Load settings from JSON/YAML files or set programmatically
- **Async support** - Works with both synchronous and asynchronous functions

## Installation

```bash
pip install garde-fou
```

## Quick Start

```python
from gardefou import GardeFou

# Protect any function with call limits
guard = GardeFou(max_calls=5, on_violation_max_calls="warn")

# Instead of: result = expensive_api_call("query")
# Use: result = guard(expensive_api_call, "query")
result = guard(your_api_function, "your", "arguments")
```

## Usage Examples

### Basic Call Limiting
```python
from gardefou import GardeFou, QuotaExceededError

# Create a guard with a 3-call limit
guard = GardeFou(max_calls=3, on_violation_max_calls="raise")

try:
    for i in range(5):
        result = guard(api_call, f"query {i}")
except QuotaExceededError:
    print("Call limit exceeded!")
```

### Duplicate Call Detection
```python
# Warn on duplicate calls
guard = GardeFou(on_violation_duplicate_call="warn")

guard(api_call, "hello")  # First call - OK
guard(api_call, "hello")  # Duplicate - Warning logged
guard(api_call, "world")  # Different call - OK
```

### Using Profiles
```python
from gardefou import Profile

# Create a profile with multiple rules
profile = Profile(
    max_calls=10,
    on_violation_max_calls="raise",
    on_violation_duplicate_call="warn"
)

guard = GardeFou(profile=profile)
```

### Configuration Files
```python
# Load from JSON/YAML file
profile = Profile(config="gardefou.config.json")
guard = GardeFou(profile=profile)

# Or pass config as dict
config = {"max_calls": 5, "on_violation_max_calls": "warn"}
profile = Profile(config=config)
```

## Configuration Options

- `max_calls`: Maximum number of calls allowed (-1 for unlimited)
- `on_violation_max_calls`: Handler when call limit exceeded ("warn", "raise", or callable)
- `on_violation_duplicate_call`: Handler for duplicate calls ("warn", "raise", or callable)
- `on_violation`: Default handler for all violations

## How It Works

garde-fou works by wrapping your function calls. Instead of calling your API function directly, you call it through the guard:

```python
# Before
result = openai.chat.completions.create(messages=[...])

# After  
guard = GardeFou(max_calls=10)
result = guard(openai.chat.completions.create, messages=[...])
```

The guard tracks calls and enforces your configured rules before executing the actual function.

## Contributing

This is part of the multi-language garde-fou toolkit. See the main repository for contributing guidelines.