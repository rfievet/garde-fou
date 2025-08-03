# Setup Guide for garde-fou Ruby Gem

## 🔑 Setting up RubyGems Account (One-time setup)

### Step 1: Create RubyGems Account
1. **RubyGems**: https://rubygems.org/sign_up

### Step 2: Generate API Key
1. Go to https://rubygems.org/profile/edit
2. Click "API Keys" tab
3. Create a new API key with appropriate permissions
4. Copy the API key

### Step 3: Configure gem credentials
```bash
gem signin
# Enter your RubyGems credentials when prompted
```

Or manually create `~/.gem/credentials`:
```yaml
---
:rubygems_api_key: your_api_key_here
```

## 🚀 Publishing Workflow

### Development Setup
```bash
cd ruby
bundle install --path vendor/bundle
```

### Test Release (Recommended first)
```bash
cd ruby
bundle exec rake release:dry
```

### Production Release
```bash
cd ruby
bundle exec rake release        # patch version
bundle exec rake release:minor  # minor version  
bundle exec rake release:major  # major version
```

### Version Bump Types
- `patch`: 0.1.0 → 0.1.1 (bug fixes)
- `minor`: 0.1.0 → 0.2.0 (new features)  
- `major`: 0.1.0 → 1.0.0 (breaking changes)

## 🔧 Manual Commands

### Run tests
```bash
cd ruby
bundle exec rake spec
```

### Run example
```bash
cd ruby
bundle exec rake example
```

### Check code style
```bash
cd ruby
bundle exec rubocop
```

### Build gem manually
```bash
cd ruby
gem build garde_fou.gemspec
```

### Push gem manually
```bash
cd ruby
gem push garde_fou-*.gem
```

## ✅ Verification

### Test your gem works
```bash
# Install from RubyGems
gem install garde_fou

# Test it works
ruby -e "require 'gardefou'; puts '✅ Works!'"
```

### Check gem page
- **RubyGems**: https://rubygems.org/gems/garde_fou

## 🎯 Benefits of This Setup

✅ **Automated workflow** - `bundle exec rake release`  
✅ **Automatic version bumping** - No conflicts  
✅ **Git integration** - Auto-commit and tag  
✅ **Code quality checks** - RuboCop and RSpec  
✅ **Professional workflow** - Industry standard  
✅ **Multiple calling patterns** - Ruby-idiomatic API