/**
 * Example usage of garde-fou TypeScript package
 */

const { GardeFou, Profile, QuotaExceededError } = require('../dist');

// Mock API function to demonstrate protection
function expensiveApiCall(query, model = 'gpt-4') {
  console.log(`Making API call with query: '${query}' using model: ${model}`);
  return `API response for: ${query}`;
}

async function expensiveAsyncApiCall(query, model = 'gpt-4') {
  console.log(`Making async API call with query: '${query}' using model: ${model}`);
  return `Async API response for: ${query}`;
}

async function main() {
  console.log('=== GardeFou TypeScript Example Usage ===\n');
  
  // Example 1: Basic usage with max_calls limit
  console.log('1. Basic usage with call limit:');
  const guard = new GardeFou({ max_calls: 3, on_violation_max_calls: 'warn' });
  
  for (let i = 0; i < 5; i++) {
    try {
      const result = guard.call(expensiveApiCall, `Query ${i + 1}`);
      console.log(`   Result: ${result}`);
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Example 2: Duplicate call detection
  console.log('2. Duplicate call detection:');
  const guardDup = new GardeFou({ on_violation_duplicate_call: 'warn' });
  
  // First call - should work
  const result1 = guardDup.call(expensiveApiCall, 'Hello world');
  console.log(`   First call result: ${result1}`);
  
  // Duplicate call - should warn
  const result2 = guardDup.call(expensiveApiCall, 'Hello world');
  console.log(`   Duplicate call result: ${result2}`);
  
  // Different call - should work
  const result3 = guardDup.call(expensiveApiCall, 'Different query');
  console.log(`   Different call result: ${result3}`);
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Example 3: Using Profile with config
  console.log('3. Using Profile configuration:');
  const profile = new Profile({
    max_calls: 2,
    on_violation_max_calls: 'raise',
    on_violation_duplicate_call: 'warn'
  });
  const guardProfile = new GardeFou({ profile });
  
  try {
    // First call
    const result = guardProfile.call(expensiveApiCall, 'Profile test 1');
    console.log(`   Call 1: ${result}`);
    
    // Second call
    const result2 = guardProfile.call(expensiveApiCall, 'Profile test 2');
    console.log(`   Call 2: ${result2}`);
    
    // Third call - should raise exception
    const result3 = guardProfile.call(expensiveApiCall, 'Profile test 3');
    console.log(`   Call 3: ${result3}`);
    
  } catch (error) {
    console.log(`   Quota exceeded: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Example 4: Async function protection
  console.log('4. Async function protection:');
  const guardAsync = new GardeFou({ max_calls: 2, on_violation_max_calls: 'raise' });
  
  try {
    const asyncResult1 = await guardAsync.callAsync(expensiveAsyncApiCall, 'Async test 1');
    console.log(`   Async call 1: ${asyncResult1}`);
    
    const asyncResult2 = await guardAsync.callAsync(expensiveAsyncApiCall, 'Async test 2');
    console.log(`   Async call 2: ${asyncResult2}`);
    
    // Third call should fail
    const asyncResult3 = await guardAsync.callAsync(expensiveAsyncApiCall, 'Async test 3');
    console.log(`   Async call 3: ${asyncResult3}`);
    
  } catch (error) {
    console.log(`   Async quota exceeded: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Example 5: Custom callback handler
  console.log('5. Custom callback handler:');
  let callbackTriggered = false;
  const customHandler = (profile) => {
    console.log(`   Custom handler triggered! Call count: ${profile.call_count}`);
    callbackTriggered = true;
  };
  
  const guardCallback = new GardeFou({ 
    max_calls: 1, 
    on_violation_max_calls: customHandler 
  });
  
  guardCallback.call(expensiveApiCall, 'Callback test 1');
  guardCallback.call(expensiveApiCall, 'Callback test 2'); // Triggers callback
  
  console.log(`   Callback was triggered: ${callbackTriggered}`);
}

if (require.main === module) {
  main().catch(console.error);
}
