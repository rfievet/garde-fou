require_relative 'garde_fou'

module Gardefou
  # Mixin module to add garde-fou protection to any class
  module GuardedClient
    def self.included(base)
      base.extend(ClassMethods)
    end

    module ClassMethods
      # Class-level method to set up protection for specific methods
      def guard_method(method_name, **options)
        original_method = instance_method(method_name)
        guard = GardeFou.new(**options)

        define_method(method_name) do |*args, **kwargs, &block|
          guard.call(original_method.bind(self), *args, **kwargs, &block)
        end
      end

      # Protect all methods matching a pattern
      def guard_methods(pattern, **options)
        instance_methods.grep(pattern).each do |method_name|
          guard_method(method_name, **options)
        end
      end
    end

    # Instance-level guard creation
    def create_guard(**options)
      GardeFou.new(**options)
    end
  end
end
