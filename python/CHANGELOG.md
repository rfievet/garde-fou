# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2025-01-19

### Added
- Initial release of garde-fou Python package
- Call counting with configurable limits
- Duplicate call detection
- Flexible violation handling (warn, raise, custom handlers)
- Configuration support via JSON/YAML files
- Async function support
- Profile-based configuration management

### Features
- `GardeFou` class for wrapping API calls with protection
- `Profile` class for managing configuration
- `QuotaExceededError` exception for call limit violations
- Support for both synchronous and asynchronous functions
- Configurable violation handlers

### Documentation
- Comprehensive README with usage examples
- API documentation and configuration options
- Quick start guide

[Unreleased]: https://github.com/rfievet/garde-fou/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/rfievet/garde-fou/releases/tag/v0.1.1