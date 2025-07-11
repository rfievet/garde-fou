# garde-fou

**garde-fou** is a multi-language toolkit for building protective wrappers around paid API clients. The goal is to make it easy to enforce usage quotas, rate limits, and duplicate detection across different programming languages.

## Features

- **Unified policy engine** that can be adapted to Python, JavaScript/TypeScript, and Ruby.
- **Guarded clients** wrap existing API clients to transparently enforce configured policies.
- **Pluggable storage adapters** for tracking request history and usage data.
- **Configuration driven** so the same policies can be reused across languages.

## Repository layout

- **python/** – Python package skeleton with stub classes.
- **js/** – TypeScript/JavaScript package skeleton with matching stubs.
- **ruby/** – Ruby gem scaffold with the same conceptual pieces.
- **.github/workflows/** – CI workflow with placeholders for lint, test, and publish steps.

Each language directory also contains simple examples and empty tests.

## Status

This project currently contains only scaffolding. Business logic has not yet been implemented and the API is still subject to change.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
