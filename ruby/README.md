# garde-fou (Ruby)

[![Gem Version](https://badge.fury.io/rb/garde_fou.svg)](https://badge.fury.io/rb/garde_fou)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**garde-fou** is a lightweight guard for protecting against accidental over-usage of paid API calls. It provides call counting and duplicate detection to help you avoid unexpected API bills.

## Features

- **Call counting** - Set maximum number of calls and get warnings or exceptions when exceeded
- **Duplicate detection** - Detect and handle repeated identical API calls
- **Flexible violation handling** - Choose to warn, raise exceptions, or use custom handlers
- **Configuration support** - Load settings from JSON/YAML files or set programmatically
- **Multiple calling patterns** - Ruby-idiomatic syntax with multiple ways to call
- **Mixin support** - Include GuardedClient module for class-level protection

## Installation

Add this line to your application's Gemfile:

```ruby
gem 'garde_fou'
```

And then execute:

    $ bundle install

Or install it yourself as:

    $ gem install garde_fou

## Quick Start

```ruby
require 'gardefou'

# Create a guard with call limits
guard = Gardefou::GardeFou.new(max_calls: 5, on_violation_max_calls: 'warn')

# Multiple calling patterns available:
# 1. Method call (explicit)
result = guard.call(your_api_method, "your", "arguments")

# 2. Bracket syntax (Ruby callable style)
result = guard[your_api_method, "your", "arguments"]

# 3. Protect method (semantic)
result = guard.protect(your_api_method, "your", "arguments")
```

## Usage Examples

### Basic Call Limiting
```ruby
require 'gardefou'

# Create a guard with a 3-call limit
guard = Gardefou::GardeFou.new(max_calls: 3, on_violation_max_calls: 'raise')

begin
  # All calling patterns work identically
  guard.call(api_method, 'query 1')
  guard[api_method, 'query 2']
  guard.protect(api_method, 'query 3')
  guard.call(api_method, 'query 4')  # This will raise!
rescue Gardefou::QuotaExceededError => e
  puts "Call limit exceeded: #{e.message}"
end
```

### Duplicate Call Detection
```ruby
# Warn on duplicate calls
guard = Gardefou::GardeFou.new(on_violation_duplicate_call: 'warn')

guard.call(api_method, 'hello')  # First call - OK
guard.call(api_method, 'hello')  # Duplicate - Warning printed
guard.call(api_method, 'world')  # Different call - OK
```

### Using Profiles
```ruby
# Create a profile with multiple rules
profile = Gardefou::Profile.new(
  max_calls: 10,
  on_violation_max_calls: 'raise',
  on_violation_duplicate_call: 'warn'
)

guard = Gardefou::GardeFou.new(profile: profile)
```

### Configuration Files
```ruby
# Load from JSON/YAML file
profile = Gardefou::Profile.new(config: 'gardefou.config.json')
guard = Gardefou::GardeFou.new(profile: profile)

# Or pass config as hash
config = { 'max_calls' => 5, 'on_violation_max_calls' => 'warn' }
profile = Gardefou::Profile.new(config: config)
```

### Custom Violation Handlers
```ruby
custom_handler = proc do |profile|
  puts "Custom violation! Call count: #{profile.call_count}"
  # Send alert, log to service, etc.
end

guard = Gardefou::GardeFou.new(
  max_calls: 5,
  on_violation_max_calls: custom_handler
)

# All calling patterns work with custom handlers
guard.call(api_method, 'test')      # Method call
guard[api_method, 'test']           # Bracket syntax
guard.protect(api_method, 'test')   # Protect method
```

### Using the GuardedClient Mixin
```ruby
class APIClient
  include Gardefou::GuardedClient
  
  def expensive_call(query)
    # Your expensive API call here
    "Result for #{query}"
  end
  
  def another_call(data)
    # Another API call
    "Processed #{data}"
  end
  
  # Guard specific methods
  guard_method :expensive_call, max_calls: 10, on_violation_max_calls: 'warn'
  
  # Guard all methods matching a pattern
  guard_methods /call$/, max_calls: 5, on_violation_duplicate_call: 'warn'
end

client = APIClient.new
client.expensive_call('test')  # Protected automatically
```

## Real-World Examples

### OpenAI API Protection
```ruby
require 'gardefou'

# Assuming you have an OpenAI client
guard = Gardefou::GardeFou.new(
  max_calls: 100,
  on_violation_max_calls: 'warn',
  on_violation_duplicate_call: 'warn'
)

# Before: Direct API call
# response = openai_client.completions(prompt: 'Hello!')

# After: Protected API call (choose your preferred syntax)
response = guard.call(openai_client.method(:completions), prompt: 'Hello!')
# or
response = guard[openai_client.method(:completions), prompt: 'Hello!']
# or  
response = guard.protect(openai_client.method(:completions), prompt: 'Hello!')
```

### Multiple API Services
```ruby
guard = Gardefou::GardeFou.new(max_calls: 50)

# Protect different APIs with the same guard
openai_result = guard.call(openai_client.method(:completions), prompt: 'test')
anthropic_result = guard[anthropic_client.method(:messages), message: 'test']
cohere_result = guard.protect(cohere_client.method(:generate), text: 'test')

puts "Total API calls made: #{guard.profile.call_count}"
```

## Configuration Options

- `max_calls`: Maximum number of calls allowed (-1 for unlimited)
- `on_violation_max_calls`: Handler when call limit exceeded (`'warn'`, `'raise'`, or Proc)
- `on_violation_duplicate_call`: Handler for duplicate calls (`'warn'`, `'raise'`, or Proc)
- `on_violation`: Default handler for all violations

## API Reference

### GardeFou Class

#### Constructor
```ruby
Gardefou::GardeFou.new(
  profile: nil,
  max_calls: nil,
  on_violation: nil,
  on_violation_max_calls: nil,
  on_violation_duplicate_call: nil
)
```

#### Methods
- `call(method, *args, **kwargs, &block)` - Execute a method with protection
- `[method, *args, **kwargs, &block]` - Ruby callable syntax (alias for call)
- `protect(method, *args, **kwargs, &block)` - Semantic alias for call

### Profile Class

#### Constructor
```ruby
Gardefou::Profile.new(
  config: nil,
  max_calls: nil,
  on_violation: nil,
  on_violation_max_calls: nil,
  on_violation_duplicate_call: nil
)
```

### GuardedClient Module

#### Class Methods
- `guard_method(method_name, **options)` - Guard a specific method
- `guard_methods(pattern, **options)` - Guard methods matching a pattern

#### Instance Methods
- `create_guard(**options)` - Create an instance-level guard

## How It Works

garde-fou works by wrapping your method calls. Instead of calling your API method directly, you call it through the guard:

```ruby
# Before
result = openai_client.completions(prompt: 'Hello!')

# After - choose your preferred syntax:
guard = Gardefou::GardeFou.new(max_calls: 10)

# Option 1: Method call
result = guard.call(openai_client.method(:completions), prompt: 'Hello!')

# Option 2: Bracket syntax (Ruby callable style)
result = guard[openai_client.method(:completions), prompt: 'Hello!']

# Option 3: Protect method (semantic)
result = guard.protect(openai_client.method(:completions), prompt: 'Hello!')
```

The guard tracks calls and enforces your configured rules before executing the actual method.

## Development

After checking out the repo, run `bin/setup` to install dependencies. Then, run `rake spec` to run the tests. You can also run `bin/console` for an interactive prompt that will allow you to experiment.

```bash
# Install dependencies
bundle install

# Run tests
rake spec

# Run example
rake example

# Run RuboCop
rake rubocop

# Run all checks
rake check
```

## Contributing

This is part of the multi-language garde-fou toolkit. See the main repository for contributing guidelines.

## License

The gem is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).