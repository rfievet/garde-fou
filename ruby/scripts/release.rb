#!/usr/bin/env ruby

require 'fileutils'
require 'json'

class RubyReleaser
  def initialize(bump_type = 'patch', dry_run = false)
    @bump_type = bump_type
    @dry_run = dry_run
  end

  def release
    puts "🚀 Starting Ruby gem release process (#{@bump_type} bump)"
    puts '🧪 DRY RUN MODE - No changes will be made' if @dry_run

    # Step 1: Run tests and checks
    puts "\n🧹 Step 1: Running tests and checks..."
    run_command('bundle exec rake spec') unless @dry_run
    run_command('bundle exec rubocop') unless @dry_run

    # Step 2: Bump version
    puts "\n📈 Step 2: Bumping version..."
    new_version = bump_version unless @dry_run
    puts "Version will be: #{new_version || current_version}"

    # Step 3: Build gem
    puts "\n🔨 Step 3: Building gem..."
    run_command('gem build garde_fou.gemspec') unless @dry_run

    # Step 4: Git operations
    puts "\n📝 Step 4: Git operations..."
    unless @dry_run
      run_command('git add .')
      run_command("git commit -m 'Release version #{new_version}'")
      run_command("git tag v#{new_version}")
      run_command('git push origin main --tags')
    end

    # Step 5: Publish gem
    puts "\n🚀 Step 5: Publishing to RubyGems..."
    unless @dry_run
      gem_file = Dir['garde_fou-*.gem'].first
      run_command("gem push #{gem_file}")
    end

    puts "\n🎉 Release #{new_version || current_version} complete!"
    puts '🌐 Check it out: https://rubygems.org/gems/garde_fou'
  end

  private

  def run_command(cmd)
    puts "🔧 Running: #{cmd}"
    system(cmd) || (puts "❌ Command failed: #{cmd}" && exit(1))
  end

  def current_version
    File.read('lib/gardefou/version.rb').match(/VERSION = '([^']+)'/)[1]
  end

  def bump_version
    current = current_version
    parts = current.split('.').map(&:to_i)

    case @bump_type
    when 'major'
      parts[0] += 1
      parts[1] = 0
      parts[2] = 0
    when 'minor'
      parts[1] += 1
      parts[2] = 0
    when 'patch'
      parts[2] += 1
    else
      raise "Invalid bump type: #{@bump_type}"
    end

    new_version = parts.join('.')

    # Update version file
    version_file = 'lib/gardefou/version.rb'
    content = File.read(version_file)
    content.gsub!(/VERSION = '[^']+'/, "VERSION = '#{new_version}'")
    File.write(version_file, content)

    puts "✅ Updated version from #{current} to #{new_version}"
    new_version
  end
end

if __FILE__ == $0
  bump_type = ARGV[0] || 'patch'
  dry_run = ARGV.include?('--dry-run')

  unless %w[major minor patch].include?(bump_type)
    puts 'Usage: ruby scripts/release.rb [major|minor|patch] [--dry-run]'
    exit 1
  end

  RubyReleaser.new(bump_type, dry_run).release
end
