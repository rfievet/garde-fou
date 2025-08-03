# Main garde-fou library
require_relative 'gardefou/version'
require_relative 'gardefou/profile'
require_relative 'gardefou/garde_fou'
require_relative 'gardefou/storage'
require_relative 'gardefou/wrapper'

module Gardefou
  # Convenience method to create a new guard
  def self.new(**options)
    GardeFou.new(**options)
  end

  # Create a guard with a profile
  def self.with_profile(profile)
    GardeFou.new(profile: profile)
  end
end
