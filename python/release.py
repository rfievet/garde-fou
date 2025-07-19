#!/usr/bin/env python3
"""
Easy release script for garde-fou Python package
Combines version bumping, building, and publishing
"""
import subprocess
import sys
import os
from pathlib import Path

def load_env():
    """Load environment variables from .env file"""
    env_file = Path(".env")
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    # Remove quotes if present
                    value = value.strip().strip('"').strip("'")
                    os.environ[key.strip()] = value
        print("✅ Loaded API tokens from .env file")
        return True
    else:
        print("⚠️  No .env file found. You'll be prompted for API tokens.")
        print("💡 Create a .env file from .env.example to avoid manual entry")
        return False

def run_command(cmd, check=True):
    """Run a command and return the result"""
    print(f"🔧 Running: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"❌ Error: {result.stderr}")
        sys.exit(1)
    return result

def main():
    # Ensure we're in the python directory
    os.chdir(Path(__file__).parent)
    
    bump_type = sys.argv[1] if len(sys.argv) > 1 else "patch"
    test_only = "--test" in sys.argv
    
    if bump_type not in ["major", "minor", "patch"]:
        print("Usage: python release.py [major|minor|patch] [--test]")
        print("  --test: Upload to Test PyPI only")
        sys.exit(1)
    
    print(f"🚀 Starting release process ({bump_type} bump)")
    
    # Load environment variables
    load_env()
    
    # Step 1: Bump version
    print("\n📈 Step 1: Bumping version...")
    run_command(f"python3 bump_version.py {bump_type}")
    
    # Step 2: Clean and build
    print("\n🧹 Step 2: Cleaning and building...")
    run_command("rm -rf dist/ build/ *.egg-info/", check=False)
    run_command("python3 -m build")
    
    # Step 3: Upload with environment variables
    if test_only:
        print("\n🧪 Step 3: Uploading to Test PyPI...")
        token = os.environ.get('TEST_PYPI_API_TOKEN')
        if token:
            print("🔑 Using API token from .env file")
            os.environ['TWINE_USERNAME'] = '__token__'
            os.environ['TWINE_PASSWORD'] = token
            run_command("python3 -m twine upload --repository testpypi dist/*")
        else:
            print("You'll be prompted for your Test PyPI API token...")
            run_command("python3 -m twine upload --repository testpypi dist/*")
        print("\n✅ Uploaded to Test PyPI!")
        print("Test install with:")
        print("pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ garde-fou")
    else:
        print("\n🚀 Step 3: Uploading to PyPI...")
        token = os.environ.get('PYPI_API_TOKEN')
        if token:
            print("🔑 Using API token from .env file")
            os.environ['TWINE_USERNAME'] = '__token__'
            os.environ['TWINE_PASSWORD'] = token
            run_command("python3 -m twine upload dist/*")
        else:
            print("You'll be prompted for your PyPI API token...")
            run_command("python3 -m twine upload dist/*")
        print("\n🎉 Released to PyPI!")
        print("Install with: pip install garde-fou")
    
    # Step 4: Git operations
    print("\n📝 Step 4: Git operations...")
    from bump_version import get_current_version
    version = get_current_version()
    
    run_command("git add .")
    run_command(f'git commit -m "Release version {version}"')
    run_command(f"git tag v{version}")
    run_command("git push origin master --tags")
    
    print(f"\n🎉 Release {version} complete!")
    if not test_only:
        print(f"🌐 Check it out: https://pypi.org/project/garde-fou/")

if __name__ == "__main__":
    main()