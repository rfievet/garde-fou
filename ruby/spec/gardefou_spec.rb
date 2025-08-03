require 'spec_helper'

RSpec.describe Gardefou::GardeFou do
  # Test functions
  let(:add_proc) { proc { |a, b| a + b } }
  let(:multiply_proc) { proc { |a, b| a * b } }
  let(:api_call) { proc { |query| "API response for: #{query}" } }

  describe 'basic functionality' do
    it 'allows unlimited calls by default' do
      guard = Gardefou::GardeFou.new

      expect(guard.call(add_proc, 1, 2)).to eq(3)
      expect(guard.call(add_proc, 3, 4)).to eq(7)
      expect(guard.call(add_proc, 5, 6)).to eq(11)
    end

    it 'enforces max_calls limit with raise' do
      guard = Gardefou::GardeFou.new(max_calls: 2, on_violation_max_calls: 'raise')

      expect(guard.call(add_proc, 1, 2)).to eq(3)
      expect(guard.call(add_proc, 3, 4)).to eq(7)

      expect { guard.call(add_proc, 5, 6) }.to raise_error(Gardefou::QuotaExceededError)
    end

    it 'enforces max_calls limit with warn' do
      guard = Gardefou::GardeFou.new(max_calls: 1, on_violation_max_calls: 'warn')

      expect(guard.call(add_proc, 1, 2)).to eq(3)

      expect { guard.call(add_proc, 3, 4) }.to output(/call quota exceeded/).to_stderr
    end
  end

  describe 'duplicate detection' do
    it 'detects duplicate calls with raise' do
      guard = Gardefou::GardeFou.new(on_violation_duplicate_call: 'raise')

      expect(guard.call(add_proc, 1, 2)).to eq(3)
      expect { guard.call(add_proc, 1, 2) }.to raise_error(Gardefou::QuotaExceededError)
    end

    it 'detects duplicate calls with warn' do
      guard = Gardefou::GardeFou.new(on_violation_duplicate_call: 'warn')

      expect(guard.call(add_proc, 1, 2)).to eq(3)
      expect { guard.call(add_proc, 1, 2) }.to output(/duplicate call detected/).to_stderr
    end

    it 'allows different calls' do
      guard = Gardefou::GardeFou.new(on_violation_duplicate_call: 'raise')

      expect(guard.call(add_proc, 1, 2)).to eq(3)
      expect(guard.call(add_proc, 2, 3)).to eq(5)
      expect(guard.call(add_proc, 3, 4)).to eq(7)
    end
  end

  describe 'calling patterns' do
    it 'supports call method' do
      guard = Gardefou::GardeFou.new
      expect(guard.call(add_proc, 1, 2)).to eq(3)
    end

    it 'supports [] syntax (Ruby callable)' do
      guard = Gardefou::GardeFou.new
      expect(guard[add_proc, 1, 2]).to eq(3)
    end

    it 'supports protect method' do
      guard = Gardefou::GardeFou.new
      expect(guard.protect(add_proc, 1, 2)).to eq(3)
    end

    it 'all calling patterns share the same quota' do
      guard = Gardefou::GardeFou.new(max_calls: 3, on_violation_max_calls: 'raise')

      guard.call(add_proc, 1, 1)      # Call 1
      guard[add_proc, 2, 2]           # Call 2
      guard.protect(add_proc, 3, 3)   # Call 3

      expect { guard.call(add_proc, 4, 4) }.to raise_error(Gardefou::QuotaExceededError)
    end
  end

  describe 'profile integration' do
    it 'accepts Profile object' do
      profile = Gardefou::Profile.new(max_calls: 1, on_violation_max_calls: 'raise')
      guard = Gardefou::GardeFou.new(profile: profile)

      expect(guard.call(add_proc, 1, 2)).to eq(3)
      expect { guard.call(add_proc, 3, 4) }.to raise_error(Gardefou::QuotaExceededError)
    end

    it 'uses custom callback handler' do
      callback_called = false
      custom_handler = proc { |_profile| callback_called = true }

      guard = Gardefou::GardeFou.new(
        max_calls: 1,
        on_violation_max_calls: custom_handler
      )

      guard.call(add_proc, 1, 2)
      guard.call(add_proc, 3, 4) # Should trigger callback

      expect(callback_called).to be true
    end

    it 'exposes profile for inspection' do
      guard = Gardefou::GardeFou.new(max_calls: 5)

      expect(guard.profile.max_calls).to eq(5)
      expect(guard.profile.call_count).to eq(0)

      guard.call(add_proc, 1, 2)
      expect(guard.profile.call_count).to eq(1)
    end
  end

  describe 'method handling' do
    let(:test_object) do
      Class.new do
        def test_method(x)
          "result: #{x}"
        end
      end.new
    end

    it 'works with Method objects' do
      guard = Gardefou::GardeFou.new
      method_obj = test_object.method(:test_method)

      expect(guard.call(method_obj, 'hello')).to eq('result: hello')
    end

    it 'works with blocks' do
      guard = Gardefou::GardeFou.new

      result = guard.call(proc { |x| x * 2 }, 5)
      expect(result).to eq(10)
    end
  end

  describe 'real-world usage patterns' do
    it 'works with API-style calls' do
      mock_api = double('API')
      allow(mock_api).to receive(:call) { |query| "Response: #{query}" }

      guard = Gardefou::GardeFou.new(max_calls: 2, on_violation_max_calls: 'warn')

      result1 = guard.call(mock_api.method(:call), 'query1')
      result2 = guard.call(mock_api.method(:call), 'query2')

      expect(result1).to eq('Response: query1')
      expect(result2).to eq('Response: query2')

      expect { guard.call(mock_api.method(:call), 'query3') }.to output(/call quota exceeded/).to_stderr
    end
  end
end
