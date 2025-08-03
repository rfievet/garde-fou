require 'json'
require 'set'

module Gardefou
  # Utility class for creating call signatures for duplicate detection
  class CallSignature
    attr_reader :fn_name, :args, :kwargs

    def initialize(fn_name, args, kwargs)
      @fn_name = fn_name
      @args = args
      @kwargs = kwargs
    end

    def to_s
      # Create deterministic string representation
      sorted_kwargs = @kwargs.sort.to_h
      {
        fn_name: @fn_name,
        args: @args,
        kwargs: sorted_kwargs
      }.to_json
    end

    def ==(other)
      other.is_a?(CallSignature) && to_s == other.to_s
    end

    def hash
      to_s.hash
    end

    alias eql? ==
  end

  # Storage adapter for tracking calls (future extension point)
  class StorageAdapter
    def initialize
      @signatures = Set.new
    end

    def store_signature(signature)
      @signatures.add(signature)
    end

    def signature_exists?(signature)
      @signatures.include?(signature)
    end

    def clear
      @signatures.clear
    end

    def count
      @signatures.size
    end
  end
end
