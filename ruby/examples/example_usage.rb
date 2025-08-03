#!/usr/bin/env ruby

require_relative '../lib/gardefou'

# Mock API function to demonstrate protection
def expensive_api_call(query, model: 'gpt-4')
  puts "Making API call with query: '#{query}' using model: #{model}"
  "API response for: #{query}"
end

def main
  puts '=== GardeFou Ruby Example Usage ==='
  puts

  # Example 1: Basic usage with max_calls limit
  puts '1. Basic usage with call limit:'
  guard = Gardefou::GardeFou.new(max_calls: 3, on_violation_max_calls: 'warn')

  5.times do |i|
    # Ruby supports multiple calling patterns
    result = case i % 3
             when 0
               guard.call(method(:expensive_api_call), "Query #{i + 1}")
             when 1
               guard[method(:expensive_api_call), "Query #{i + 1}"]
             else
               guard.protect(method(:expensive_api_call), "Query #{i + 1}")
             end
    puts "   Result: #{result}"
  rescue Gardefou::QuotaExceededError => e
    puts "   Error: #{e.message}"
  end

  puts
  puts '=' * 50
  puts

  # Example 2: Duplicate call detection
  puts '2. Duplicate call detection:'
  guard_dup = Gardefou::GardeFou.new(on_violation_duplicate_call: 'warn')

  # First call - should work
  result1 = guard_dup.call(method(:expensive_api_call), 'Hello world')
  puts "   First call result: #{result1}"

  # Duplicate call - should warn
  result2 = guard_dup.call(method(:expensive_api_call), 'Hello world')
  puts "   Duplicate call result: #{result2}"

  # Different call - should work
  result3 = guard_dup.call(method(:expensive_api_call), 'Different query')
  puts "   Different call result: #{result3}"

  puts
  puts '=' * 50
  puts

  # Example 3: Using Profile with config
  puts '3. Using Profile configuration:'
  profile = Gardefou::Profile.new(
    max_calls: 2,
    on_violation_max_calls: 'raise',
    on_violation_duplicate_call: 'warn'
  )
  guard_profile = Gardefou::GardeFou.new(profile: profile)

  begin
    # First call
    result = guard_profile.call(method(:expensive_api_call), 'Profile test 1')
    puts "   Call 1: #{result}"

    # Second call
    result2 = guard_profile.call(method(:expensive_api_call), 'Profile test 2')
    puts "   Call 2: #{result2}"

    # Third call - should raise exception
    result3 = guard_profile.call(method(:expensive_api_call), 'Profile test 3')
    puts "   Call 3: #{result3}"
  rescue Gardefou::QuotaExceededError => e
    puts "   Quota exceeded: #{e.message}"
  end

  puts
  puts '=' * 50
  puts

  # Example 4: Custom callback handler
  puts '4. Custom callback handler:'
  callback_triggered = false
  custom_handler = proc do |profile|
    puts "   Custom handler triggered! Call count: #{profile.call_count}"
    callback_triggered = true
  end

  guard_callback = Gardefou::GardeFou.new(
    max_calls: 1,
    on_violation_max_calls: custom_handler
  )

  guard_callback.call(method(:expensive_api_call), 'Callback test 1')
  guard_callback.call(method(:expensive_api_call), 'Callback test 2') # Triggers callback

  puts "   Callback was triggered: #{callback_triggered}"

  puts
  puts '=' * 50
  puts

  # Example 5: Using the mixin
  puts '5. Using GuardedClient mixin:'

  api_client = Class.new do
    include Gardefou::GuardedClient

    def fetch_data(query)
      puts "Fetching data for: #{query}"
      "Data: #{query}"
    end

    def process_data(data)
      puts "Processing: #{data}"
      "Processed: #{data}"
    end

    # Guard specific method
    guard_method :fetch_data, max_calls: 2, on_violation_max_calls: 'warn'
  end.new

  puts '   First fetch:'
  result1 = api_client.fetch_data('user123')
  puts "   Result: #{result1}"

  puts '   Second fetch:'
  result2 = api_client.fetch_data('user456')
  puts "   Result: #{result2}"

  puts '   Third fetch (should warn):'
  result3 = api_client.fetch_data('user789')
  puts "   Result: #{result3}"

  puts
  puts '=' * 50
  puts

  # Example 6: Demonstrating all calling patterns work identically
  puts '6. All calling patterns (call vs [] vs protect):'
  guard_all = Gardefou::GardeFou.new(max_calls: 4, on_violation_max_calls: 'warn')

  puts "   Starting call count: #{guard_all.profile.call_count}"

  guard_all.call(method(:expensive_api_call), 'Call method')
  puts "   After .call(): #{guard_all.profile.call_count}"

  guard_all[method(:expensive_api_call), 'Bracket method']
  puts "   After []: #{guard_all.profile.call_count}"

  guard_all.protect(method(:expensive_api_call), 'Protect method')
  puts "   After .protect(): #{guard_all.profile.call_count}"

  # This should trigger warning (4th call)
  guard_all.call(method(:expensive_api_call), 'Final call')
  puts "   After final call: #{guard_all.profile.call_count}"

  # This should also warn (5th call)
  guard_all[method(:expensive_api_call), 'Over limit call']
  puts "   After over-limit call: #{guard_all.profile.call_count}"
end

main if __FILE__ == $0
