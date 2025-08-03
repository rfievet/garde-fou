# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-07-19

### Added
- Initial Ruby implementation of garde-fou
- Call counting with configurable limits
- Duplicate call detection
- Multiple calling patterns (call, [], protect)
- Flexible violation handlers (warn, raise, custom procs)
- Configuration loading from JSON/YAML files
- GuardedClient mixin for class-level protection
- Comprehensive test suite with RSpec
- Ruby-idiomatic API design

[Unreleased]: https://github.com/rfievet/garde-fou/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/rfievet/garde-fou/releases/tag/v0.1.0