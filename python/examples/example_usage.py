"""Example usage of gardefou package."""

import time
from gardefou import GardeFou, Profile, QuotaExceededError

# Mock API function to demonstrate protection
def expensive_api_call(query, model="gpt-4"):
    """Simulate an expensive API call."""
    print(f"Making API call with query: '{query}' using model: {model}")
    return f"API response for: {query}"

def main():
    print("=== GardeFou Example Usage ===\n")
    
    # Example 1: Basic usage with max_calls limit
    print("1. Basic usage with call limit:")
    guard = GardeFou(max_calls=3, on_violation_max_calls="warn")
    
    for i in range(5):
        try:
            result = guard(expensive_api_call, f"Query {i+1}")
            print(f"   Result: {result}")
        except QuotaExceededError as e:
            print(f"   Error: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Example 2: Duplicate call detection
    print("2. Duplicate call detection:")
    guard_dup = GardeFou(on_violation_duplicate_call="warn")
    
    # First call - should work
    result1 = guard_dup(expensive_api_call, "Hello world")
    print(f"   First call result: {result1}")
    
    # Duplicate call - should warn
    result2 = guard_dup(expensive_api_call, "Hello world")
    print(f"   Duplicate call result: {result2}")
    
    # Different call - should work
    result3 = guard_dup(expensive_api_call, "Different query")
    print(f"   Different call result: {result3}")
    
    print("\n" + "="*50 + "\n")
    
    # Example 3: Using Profile with config
    print("3. Using Profile configuration:")
    profile = Profile(
        max_calls=2,
        on_violation_max_calls="raise",
        on_violation_duplicate_call="warn"
    )
    guard_profile = GardeFou(profile=profile)
    
    try:
        # First call
        result = guard_profile(expensive_api_call, "Profile test 1")
        print(f"   Call 1: {result}")
        
        # Second call
        result = guard_profile(expensive_api_call, "Profile test 2")
        print(f"   Call 2: {result}")
        
        # Third call - should raise exception
        result = guard_profile(expensive_api_call, "Profile test 3")
        print(f"   Call 3: {result}")
        
    except QuotaExceededError as e:
        print(f"   Quota exceeded: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Example 4: Loading from config file
    print("4. Loading configuration from file:")
    try:
        # Note: This would load from gardefou.config.json if it existed
        # For now, we'll create a profile manually
        file_profile = Profile(config={"max_calls": 1, "on_violation_max_calls": "warn"})
        guard_file = GardeFou(profile=file_profile)
        
        result = guard_file(expensive_api_call, "Config file test")
        print(f"   Result: {result}")
        
    except Exception as e:
        print(f"   Config loading example: {e}")

if __name__ == "__main__":
    main()
