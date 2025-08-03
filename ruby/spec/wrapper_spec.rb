require 'spec_helper'

RSpec.describe Gardefou::GuardedClient do
  let(:test_class) do
    Class.new do
      include Gardefou::GuardedClient

      def expensive_api_call(query)
        "API response for: #{query}"
      end

      def another_api_call(data)
        "Processed: #{data}"
      end
    end
  end

  describe 'class methods' do
    it 'guards specific methods' do
      test_class.guard_method(:expensive_api_call, max_calls: 2, on_violation_max_calls: 'raise')

      instance = test_class.new

      expect(instance.expensive_api_call('test1')).to eq('API response for: test1')
      expect(instance.expensive_api_call('test2')).to eq('API response for: test2')
      expect { instance.expensive_api_call('test3') }.to raise_error(Gardefou::QuotaExceededError)
    end

    it 'guards methods matching pattern' do
      test_class.guard_methods(/api_call$/, max_calls: 1, on_violation_max_calls: 'warn')

      instance = test_class.new

      instance.expensive_api_call('test1')
      expect { instance.expensive_api_call('test2') }.to output(/call quota exceeded/).to_stderr

      instance.another_api_call('data1')
      expect { instance.another_api_call('data2') }.to output(/call quota exceeded/).to_stderr
    end
  end

  describe 'instance methods' do
    it 'creates instance-level guards' do
      instance = test_class.new
      guard = instance.create_guard(max_calls: 2)

      expect(guard.call(instance.method(:expensive_api_call), 'test1')).to eq('API response for: test1')
      expect(guard.call(instance.method(:expensive_api_call), 'test2')).to eq('API response for: test2')
      expect { guard.call(instance.method(:expensive_api_call), 'test3') }.to raise_error(Gardefou::QuotaExceededError)
    end
  end
end
