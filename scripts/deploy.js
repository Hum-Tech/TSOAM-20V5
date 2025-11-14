#!/usr/bin/env node

/**
 * Deployment Script for TSOAM Church Management System
 * Prepares application for production deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚀 TSOAM Production Deployment Preparation');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━��━━━━━━━━━━━━━━━━━━━━━━━━━━━');

try {
  // Step 1: Clean previous builds
  console.log('\n📦 Step 1: Cleaning previous builds...');
  const distPath = path.join(__dirname, '../client/dist');
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    console.log('✅ Cleaned dist directory');
  }

  // Step 2: Install dependencies
  console.log('\n📦 Step 2: Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed');
  } catch (error) {
    console.error('❌ Failed to install dependencies');
    process.exit(1);
  }

  // Step 3: Build client
  console.log('\n🔨 Step 3: Building client application...');
  try {
    execSync('cd client && npm install && npm run build-only', { stdio: 'inherit' });
    console.log('✅ Client build complete');
  } catch (error) {
    console.error('❌ Failed to build client');
    process.exit(1);
  }

  // Step 4: Verify build
  console.log('\n🔍 Step 4: Verifying build...');
  const buildFiles = path.join(__dirname, '../client/dist');
  if (!fs.existsSync(buildFiles)) {
    console.error('❌ Build verification failed - dist directory not found');
    process.exit(1);
  }
  
  const indexFile = path.join(buildFiles, 'index.html');
  if (!fs.existsSync(indexFile)) {
    console.error('❌ Build verification failed - index.html not found');
    process.exit(1);
  }
  
  console.log('✅ Build verified - ready for deployment');

  // Step 5: Environment check
  console.log('\n🔧 Step 5: Environment configuration...');
  console.log('✅ NODE_ENV should be set to: production');
  console.log('✅ USE_SQLITE should be set to: false (for MySQL deployment)');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Production deployment preparation complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📝 Next steps:');
  console.log('   1. Commit changes: git add . && git commit -m "Deploy to production"');
  console.log('   2. Push to git: git push origin main');
  console.log('   3. Redeploy on Fly.io: flyctl deploy');
  console.log('\n🌐 Application will be served from: client/dist');
  console.log('🔌 API server will run on: PORT 3001');
  console.log('━━━━━━━━��━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

} catch (error) {
  console.error('\n❌ Deployment preparation failed:', error.message);
  process.exit(1);
}
