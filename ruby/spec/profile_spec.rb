require 'spec_helper'

RSpec.describe Gardefou::Profile do
  describe 'initialization' do
    it 'sets default values' do
      profile = Gardefou::Profile.new

      expect(profile.max_calls).to eq(-1)
      expect(profile.on_violation).to eq('raise')
      expect(profile.call_count).to eq(0)
    end

    it 'accepts configuration options' do
      profile = Gardefou::Profile.new(
        max_calls: 5,
        on_violation: 'warn',
        on_violation_max_calls: 'raise'
      )

      expect(profile.max_calls).to eq(5)
      expect(profile.on_violation).to eq('warn')
      expect(profile.on_violation_max_calls).to eq('raise')
    end

    it 'loads from hash config' do
      config = {
        'max_calls' => 10,
        'on_violation' => 'warn'
      }

      profile = Gardefou::Profile.new(config: config)

      expect(profile.max_calls).to eq(10)
      expect(profile.on_violation).to eq('warn')
    end

    it 'overrides config with explicit options' do
      config = { 'max_calls' => 5 }
      profile = Gardefou::Profile.new(
        config: config,
        max_calls: 10,
        on_violation: 'warn'
      )

      expect(profile.max_calls).to eq(10)
      expect(profile.on_violation).to eq('warn')
    end
  end

  describe 'call tracking' do
    it 'increments call count' do
      profile = Gardefou::Profile.new(max_calls: 5)

      expect(profile.call_count).to eq(0)
      profile.check('test_method', [1, 2], {})
      expect(profile.call_count).to eq(1)
    end

    it 'enforces max calls limit' do
      profile = Gardefou::Profile.new(max_calls: 1, on_violation_max_calls: 'raise')

      profile.check('test_method', [1], {})
      expect { profile.check('test_method', [2], {}) }.to raise_error(Gardefou::QuotaExceededError)
    end
  end

  describe 'duplicate detection' do
    it 'detects identical calls' do
      profile = Gardefou::Profile.new(on_violation_duplicate_call: 'raise')

      profile.check('test_method', [1, 2], { key: 'value' })
      expect { profile.check('test_method', [1, 2], { key: 'value' }) }.to raise_error(Gardefou::QuotaExceededError)
    end

    it 'allows different calls' do
      profile = Gardefou::Profile.new(on_violation_duplicate_call: 'raise')

      profile.check('test_method', [1, 2], { key: 'value' })
      expect { profile.check('test_method', [1, 3], { key: 'value' }) }.not_to raise_error
      expect { profile.check('test_method', [1, 2], { key: 'other' }) }.not_to raise_error
    end
  end

  describe 'violation handlers' do
    it 'handles warn violations' do
      profile = Gardefou::Profile.new(max_calls: 1, on_violation_max_calls: 'warn')

      profile.check('test', [], {})
      expect { profile.check('test', [], {}) }.to output(/call quota exceeded/).to_stderr
    end

    it 'handles raise violations' do
      profile = Gardefou::Profile.new(max_calls: 1, on_violation_max_calls: 'raise')

      profile.check('test', [], {})
      expect { profile.check('test', [], {}) }.to raise_error(Gardefou::QuotaExceededError)
    end

    it 'handles custom callback violations' do
      callback_called = false
      custom_handler = proc { |_profile| callback_called = true }

      profile = Gardefou::Profile.new(max_calls: 1, on_violation_max_calls: custom_handler)

      profile.check('test', [], {})
      profile.check('test', [], {})

      expect(callback_called).to be true
    end
  end
end
