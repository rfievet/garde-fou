require 'json'
require 'yaml'

module Gardefou
  class QuotaExceededError < StandardError; end

  class Profile
    attr_reader :max_calls, :on_violation, :on_violation_max_calls, :on_violation_duplicate_call, :call_count

    def initialize(config: nil, max_calls: nil, on_violation: nil,
                   on_violation_max_calls: nil, on_violation_duplicate_call: nil)
      # Load base data from file or hash
      data = {}

      if config.is_a?(String)
        # Load from file
        content = File.read(config)
        data = if config.end_with?('.yaml', '.yml')
                 YAML.safe_load(content)
               else
                 JSON.parse(content)
               end
      elsif config.is_a?(Hash)
        data = config.dup
      end

      # Override with explicit options
      data['max_calls'] = max_calls unless max_calls.nil?
      data['on_violation'] = on_violation unless on_violation.nil?
      data['on_violation_max_calls'] = on_violation_max_calls unless on_violation_max_calls.nil?
      data['on_violation_duplicate_call'] = on_violation_duplicate_call unless on_violation_duplicate_call.nil?

      # Assign settings with defaults
      @max_calls = data['max_calls'] || -1
      @on_violation = data['on_violation'] || 'raise'
      @on_violation_max_calls = data['on_violation_max_calls'] || @on_violation
      @on_violation_duplicate_call = data['on_violation_duplicate_call'] || @on_violation

      @call_count = 0
      @call_signatures = Set.new

      # Track which rules were explicitly configured
      @max_calls_enabled = data.key?('max_calls') && @max_calls >= 0
      @dup_enabled = data.key?('on_violation_duplicate_call')
    end

    def check(fn_name = nil, args = [], kwargs = {})
      check_max_call if @max_calls_enabled
      check_duplicate(fn_name, args, kwargs) if @dup_enabled
    end

    private

    def check_max_call
      @call_count += 1
      return unless @call_count > @max_calls

      msg = "GardeFou: call quota exceeded (#{@call_count}/#{@max_calls})"
      handle_violation(@on_violation_max_calls, msg)
    end

    def check_duplicate(fn_name = nil, args = [], kwargs = {})
      signature = create_signature(fn_name, args, kwargs)

      if @call_signatures.include?(signature)
        msg = "GardeFou: duplicate call detected for #{fn_name} with args #{args.inspect} and kwargs #{kwargs.inspect}"
        handle_violation(@on_violation_duplicate_call, msg)
      else
        @call_signatures.add(signature)
      end
    end

    def create_signature(fn_name, args, kwargs)
      # Create a deterministic signature for duplicate detection
      sorted_kwargs = kwargs.sort.to_h
      {
        fn_name: fn_name,
        args: args,
        kwargs: sorted_kwargs
      }.to_json
    end

    def handle_violation(handler, message)
      case handler
      when 'warn'
        warn(message)
      when 'raise'
        raise QuotaExceededError, message
      when Proc
        handler.call(self)
      else
        raise ArgumentError, "Invalid violation handler: #{handler}"
      end
    end
  end
end
