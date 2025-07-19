#!/usr/bin/env node
/**
 * Easy release script for garde-fou TypeScript package
 * Combines version bumping, building, testing, and publishing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(cmd, options = {}) {
  console.log(`🔧 Running: ${cmd}`);
  try {
    const result = execSync(cmd, { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..'),
      ...options 
    });
    return result;
  } catch (error) {
    console.error(`❌ Error running command: ${cmd}`);
    process.exit(1);
  }
}

function getCurrentVersion() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return packageJson.version;
}

function main() {
  const bumpType = process.argv[2] || 'patch';
  const dryRun = process.argv.includes('--dry-run');
  
  if (!['major', 'minor', 'patch'].includes(bumpType)) {
    console.log('Usage: node release.js [major|minor|patch] [--dry-run]');
    console.log('  --dry-run: Show what would be done without actually doing it');
    process.exit(1);
  }
  
  console.log(`🚀 Starting release process (${bumpType} bump)`);
  if (dryRun) {
    console.log('🧪 DRY RUN MODE - No changes will be made');
  }
  
  // Step 1: Clean and test
  console.log('\n🧹 Step 1: Cleaning and testing...');
  if (!dryRun) {
    runCommand('npm run clean');
    runCommand('npm run build');
    runCommand('npm test');
  }
  
  // Step 2: Bump version
  console.log('\n📈 Step 2: Bumping version...');
  if (!dryRun) {
    runCommand(`npm run bump:${bumpType}`);
  }
  
  const newVersion = getCurrentVersion();
  console.log(`Version will be: ${newVersion}`);
  
  // Step 3: Git operations
  console.log('\n📝 Step 3: Git operations...');
  if (!dryRun) {
    runCommand('git add .');
    runCommand(`git commit -m "Release version ${newVersion}"`);
    runCommand(`git tag v${newVersion}`);
    runCommand('git push origin main --tags');
  }
  
  // Step 4: Publish to npm
  console.log('\n🚀 Step 4: Publishing to npm...');
  if (!dryRun) {
    runCommand('npm publish');
  }
  
  console.log(`\n🎉 Release ${newVersion} complete!`);
  console.log(`🌐 Check it out: https://www.npmjs.com/package/garde-fou`);
}

if (require.main === module) {
  main();
}