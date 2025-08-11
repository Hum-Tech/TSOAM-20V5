#!/usr/bin/env node

/**
 * Build System Script for TSOAM Church Management System
 * Builds the entire system for production deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting TSOAM Church Management System Build Process...\n');

// Function to run commands and handle errors
function runCommand(command, description, directory = process.cwd()) {
  console.log(`📦 ${description}...`);
  try {
    const result = execSync(command, { 
      cwd: directory, 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    console.log(`✅ ${description} completed successfully`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(error.stdout || error.message);
    process.exit(1);
  }
}

// Main build process
async function buildSystem() {
  console.log('Step 1: Installing dependencies...');
  
  // Install root dependencies
  runCommand('npm install', 'Installing root dependencies', '.');
  
  // Install client dependencies
  console.log('\nStep 2: Building client application...');
  runCommand('npm install', 'Installing client dependencies', 'client');
  
  // Type check first
  console.log('Running TypeScript type check...');
  runCommand('npx tsc --noEmit --skipLibCheck', 'TypeScript type check', 'client');
  
  // Build client
  runCommand('npx vite build', 'Building client application', 'client');
  
  // Install server dependencies
  console.log('\nStep 3: Installing server dependencies...');
  runCommand('npm install', 'Installing server dependencies', 'server');
  
  // Create production structure
  console.log('\nStep 4: Organizing for production...');
  if (fs.existsSync('./organize-for-production.js')) {
    runCommand('node organize-for-production.js', 'Organizing production files');
  }
  
  console.log('\n🎉 Build completed successfully!');
  console.log('\n📋 Build Summary:');
  console.log('  ✅ Client application built');
  console.log('  ✅ Server dependencies installed');
  console.log('  ✅ Production files organized');
  console.log('\n📁 Output: client/dist/ contains the built application');
}

// Run the build
buildSystem().catch(error => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});
