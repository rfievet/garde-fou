#!/usr/bin/env node
/**
 * Automatic version bumping script for garde-fou TypeScript package
 */

const fs = require('fs');
const path = require('path');

function getCurrentVersion() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return packageJson.version;
}

function bumpVersion(currentVersion, bumpType = 'patch') {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error("bumpType must be 'major', 'minor', or 'patch'");
  }
}

function updatePackageJson(newVersion) {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  packageJson.version = newVersion;
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✅ Updated package.json to version ${newVersion}`);
}

function main() {
  const bumpType = process.argv[2] || 'patch';
  
  if (!['major', 'minor', 'patch'].includes(bumpType)) {
    console.log('Usage: node bump-version.js [major|minor|patch]');
    console.log('Default: patch');
    process.exit(1);
  }
  
  try {
    const currentVersion = getCurrentVersion();
    const newVersion = bumpVersion(currentVersion, bumpType);
    
    console.log(`🔄 Bumping version from ${currentVersion} to ${newVersion} (${bumpType})`);
    
    updatePackageJson(newVersion);
    
    console.log('\n🎉 Version bumped successfully!');
    console.log('Next steps:');
    console.log('1. git add .');
    console.log(`2. git commit -m 'Bump version to ${newVersion}'`);
    console.log(`3. git tag v${newVersion}`);
    console.log('4. git push origin main --tags');
    console.log('5. npm publish');
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}