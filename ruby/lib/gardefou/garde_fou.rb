require_relative 'profile'

module Gardefou
  class GardeFou
    attr_reader :profile

    def initialize(profile: nil, **profile_options)
      @profile = profile || Profile.new(**profile_options)
    end

    # Main callable interface - allows guard.call(method, *args, **kwargs)
    def call(method, *args, **kwargs, &block)
      # Extract method name for tracking
      method_name = extract_method_name(method)

      # Run profile checks
      @profile.check(method_name, args, kwargs)

      # Execute the method
      if kwargs.empty?
        # Ruby 2.6 compatibility - avoid passing empty kwargs
        method.call(*args, &block)
      else
        method.call(*args, **kwargs, &block)
      end
    end

    # Ruby-style callable interface - allows guard.(method, *args, **kwargs)
    # This is Ruby's equivalent to Python's __call__
    alias [] call

    # Alternative syntax for those who prefer it
    def protect(method, *args, **kwargs, &block)
      call(method, *args, **kwargs, &block)
    end

    private

    def extract_method_name(method)
      case method
      when Method
        "#{method.receiver.class}##{method.name}"
      when UnboundMethod
        "#{method.owner}##{method.name}"
      when Proc
        method.source_location ? "Proc@#{method.source_location.join(':')}" : 'Proc'
      else
        method.class.name
      end
    end
  end
end
