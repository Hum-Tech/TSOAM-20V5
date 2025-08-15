#!/usr/bin/env node

/**
 * TSOAM Church Management System - Dependency Installation Script
 * Ensures all dependencies are properly installed across all package.json files
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`🔧 ${message}`);
}

function error(message) {
  console.error(`❌ ${message}`);
}

function success(message) {
  console.log(`✅ ${message}`);
}

async function installDependencies() {
  console.log("🚀 TSOAM Church Management System - Dependency Installation");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    // Step 1: Install root dependencies
    log("Installing root dependencies...");
    if (fs.existsSync('package.json')) {
      execSync('npm install', { stdio: 'inherit' });
      success("Root dependencies installed");
    }

    // Step 2: Install client dependencies
    log("Installing client dependencies...");
    if (fs.existsSync('client/package.json')) {
      process.chdir('client');
      execSync('npm install', { stdio: 'inherit' });
      process.chdir('..');
      success("Client dependencies installed");
    }

    // Step 3: Install server dependencies
    log("Installing server dependencies...");
    if (fs.existsSync('server/package.json')) {
      process.chdir('server');
      execSync('npm install', { stdio: 'inherit' });
      process.chdir('..');
      success("Server dependencies installed");
    }

    // Step 4: Verify critical dependencies
    log("Verifying critical dependencies...");
    
    const criticalDeps = [
      'express', 'cors', 'multer', 'bcryptjs', 
      'jsonwebtoken', 'uuid', 'mysql2', 'dotenv'
    ];

    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const missingDeps = criticalDeps.filter(dep => !packageJson.dependencies[dep]);

    if (missingDeps.length > 0) {
      log(`Installing missing critical dependencies: ${missingDeps.join(', ')}`);
      execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
      success("Missing dependencies installed");
    } else {
      success("All critical dependencies are present");
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    success("All dependencies installed successfully!");
    console.log("🔧 You can now run:");
    console.log("   npm run build  - Build the client");
    console.log("   npm start      - Start the production server");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━���━━━━━━━━━━━━");

  } catch (err) {
    error("Dependency installation failed:");
    console.error(err.message);
    process.exit(1);
  }
}

// Run installation
if (require.main === module) {
  installDependencies();
}

module.exports = { installDependencies };
