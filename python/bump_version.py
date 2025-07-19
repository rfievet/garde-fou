#!/usr/bin/env python3
"""
Automatic version bumping script for garde-fou Python package
"""
import re
import sys
from pathlib import Path
from datetime import datetime

def get_current_version():
    """Get current version from pyproject.toml"""
    pyproject_path = Path("pyproject.toml")
    content = pyproject_path.read_text()
    
    match = re.search(r'version = "([^"]+)"', content)
    if not match:
        raise ValueError("Could not find version in pyproject.toml")
    
    return match.group(1)

def bump_version(current_version, bump_type="patch"):
    """Bump version based on type (major, minor, patch)"""
    major, minor, patch = map(int, current_version.split('.'))
    
    if bump_type == "major":
        major += 1
        minor = 0
        patch = 0
    elif bump_type == "minor":
        minor += 1
        patch = 0
    elif bump_type == "patch":
        patch += 1
    else:
        raise ValueError("bump_type must be 'major', 'minor', or 'patch'")
    
    return f"{major}.{minor}.{patch}"

def update_pyproject_toml(new_version):
    """Update version in pyproject.toml"""
    pyproject_path = Path("pyproject.toml")
    content = pyproject_path.read_text()
    
    updated_content = re.sub(
        r'version = "[^"]+"',
        f'version = "{new_version}"',
        content
    )
    
    pyproject_path.write_text(updated_content)
    print(f"✅ Updated pyproject.toml to version {new_version}")

def update_changelog(new_version, current_version):
    """Update CHANGELOG.md with new version"""
    changelog_path = Path("CHANGELOG.md")
    content = changelog_path.read_text()
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Add new version entry after [Unreleased]
    new_entry = f"""
## [{new_version}] - {today}

### Changed
- Version bump from {current_version} to {new_version}

"""
    
    # Insert after the [Unreleased] section
    updated_content = re.sub(
        r'(## \[Unreleased\]\n)',
        f'\\1{new_entry}',
        content
    )
    
    # Update the links at the bottom
    updated_content = re.sub(
        r'\[Unreleased\]: https://github\.com/rfievet/garde-fou/compare/v[^.]+\.[^.]+\.[^.]+\.\.\.HEAD',
        f'[Unreleased]: https://github.com/rfievet/garde-fou/compare/v{new_version}...HEAD',
        updated_content
    )
    
    # Add new version link
    updated_content = re.sub(
        r'(\[Unreleased\]: [^\n]+\n)',
        f'\\1[{new_version}]: https://github.com/rfievet/garde-fou/releases/tag/v{new_version}\n',
        updated_content
    )
    
    changelog_path.write_text(updated_content)
    print(f"✅ Updated CHANGELOG.md with version {new_version}")

def main():
    bump_type = sys.argv[1] if len(sys.argv) > 1 else "patch"
    
    if bump_type not in ["major", "minor", "patch"]:
        print("Usage: python bump_version.py [major|minor|patch]")
        print("Default: patch")
        sys.exit(1)
    
    try:
        current_version = get_current_version()
        new_version = bump_version(current_version, bump_type)
        
        print(f"🔄 Bumping version from {current_version} to {new_version} ({bump_type})")
        
        update_pyproject_toml(new_version)
        update_changelog(new_version, current_version)
        
        print(f"\n🎉 Version bumped successfully!")
        print(f"Next steps:")
        print(f"1. git add .")
        print(f"2. git commit -m 'Bump version to {new_version}'")
        print(f"3. git tag v{new_version}")
        print(f"4. git push origin master --tags")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()