# Setup Guide for garde-fou Python Package

## 🔑 Setting up API Tokens (One-time setup)

### Step 1: Create PyPI Accounts
1. **Production PyPI**: https://pypi.org/account/register/
2. **Test PyPI**: https://test.pypi.org/account/register/

### Step 2: Generate API Tokens
1. **Test PyPI**: https://test.pypi.org/manage/account/token/
   - Click "Add API token"
   - Name: `garde-fou-test`
   - Scope: "Entire account" (or specific to garde-fou project)
   - Copy the token (starts with `pypi-`)

2. **Production PyPI**: https://pypi.org/manage/account/token/
   - Click "Add API token"  
   - Name: `garde-fou-prod`
   - Scope: "Entire account" (or specific to garde-fou project)
   - Copy the token (starts with `pypi-`)

### Step 3: Create .env File
```bash
cd python
cp .env.example .env
```

Edit `.env` and add your tokens:
```bash
# PyPI API Tokens
PYPI_API_TOKEN=pypi-your-actual-production-token-here
TEST_PYPI_API_TOKEN=pypi-your-actual-test-token-here
```

**⚠️ IMPORTANT**: Never commit the `.env` file to git! It's already in `.gitignore`.

## 🚀 Publishing Workflow

### Test Release (Recommended first)
```bash
cd python
python3 release.py patch --test
```

### Production Release
```bash
cd python
python3 release.py patch
```

### Version Bump Types
- `patch`: 0.1.5 → 0.1.6 (bug fixes)
- `minor`: 0.1.5 → 0.2.0 (new features)  
- `major`: 0.1.5 → 1.0.0 (breaking changes)

## 🔧 Manual Commands

### Just bump version (no publish)
```bash
cd python
python3 bump_version.py patch
```

### Just build package
```bash
cd python
python3 -m build
```

### Manual upload (if needed)
```bash
cd python
python3 -m twine upload --repository testpypi dist/*  # Test PyPI
python3 -m twine upload dist/*                        # Production PyPI
```

## ✅ Verification

### Test your package works
```bash
# From Test PyPI
pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ garde-fou

# From Production PyPI  
pip install garde-fou

# Test it works
python3 -c "from gardefou import GardeFou; print('✅ Works!')"
```

### Check package pages
- **Test PyPI**: https://test.pypi.org/project/garde-fou/
- **Production PyPI**: https://pypi.org/project/garde-fou/

## 🎯 Benefits of This Setup

✅ **No more copy-pasting tokens** - Stored securely in `.env`  
✅ **One command releases** - `python3 release.py patch --test`  
✅ **Automatic version bumping** - No conflicts  
✅ **Git integration** - Auto-commit and tag  
✅ **Safe testing** - Test PyPI first  
✅ **Professional workflow** - Industry standard