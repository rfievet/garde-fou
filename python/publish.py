#!/usr/bin/env python3
"""
Publishing helper script for garde-fou Python package
"""
import subprocess
import sys
import os
from pathlib import Path

def run_command(cmd, check=True):
    """Run a command and return the result"""
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"Error: {result.stderr}")
        sys.exit(1)
    return result

def main():
    # Ensure we're in the python directory
    os.chdir(Path(__file__).parent)
    
    print("🔧 Installing build tools...")
    run_command("pip install --upgrade build twine")
    
    print("\n🧹 Cleaning previous builds...")
    run_command("rm -rf dist/ build/ *.egg-info/", check=False)
    
    print("\n🔨 Building package...")
    run_command("python -m build")
    
    print("\n📦 Package built successfully!")
    print("Files created:")
    for file in Path("dist").glob("*"):
        print(f"  - {file}")
    
    print("\n🚀 Ready to publish!")
    print("\nNext steps:")
    print("1. Test upload: python -m twine upload --repository testpypi dist/*")
    print("2. Production upload: python -m twine upload dist/*")
    print("\nMake sure you have your PyPI API tokens set up!")

if __name__ == "__main__":
    main()