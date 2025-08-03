require_relative 'lib/gardefou/version'

Gem::Specification.new do |spec|
  spec.name          = 'garde_fou'
  spec.version       = Gardefou::VERSION
  spec.authors       = ['Robin Fiévet']
  spec.email         = ['robinfievet@gmail.com']

  spec.summary       = 'Protective wrappers around paid API clients with quotas & duplicate detection'
  spec.description   = 'A lightweight guard for protecting against accidental over-usage of paid API calls. Provides call counting and duplicate detection to help you avoid unexpected API bills.'
  spec.homepage      = 'https://github.com/rfievet/garde-fou'
  spec.license       = 'MIT'

  spec.required_ruby_version = '>= 2.6.0'

  spec.metadata['homepage_uri'] = spec.homepage
  spec.metadata['source_code_uri'] = 'https://github.com/rfievet/garde-fou'
  spec.metadata['changelog_uri'] = 'https://github.com/rfievet/garde-fou/blob/main/ruby/CHANGELOG.md'

  # Specify which files should be added to the gem when it is released.
  spec.files = Dir['lib/**/*', 'README.md', 'CHANGELOG.md', 'LICENSE*']
  spec.bindir        = 'exe'
  spec.executables   = spec.files.grep(%r{\Aexe/}) { |f| File.basename(f) }
  spec.require_paths = ['lib']

  # Dependencies
  spec.add_dependency 'json', '~> 2.0'

  # Development dependencies
  spec.add_development_dependency 'rake', '~> 13.0'
  spec.add_development_dependency 'rspec', '~> 3.0'
  spec.add_development_dependency 'rubocop', '~> 1.0'
  spec.metadata['rubygems_mfa_required'] = 'true'
end
