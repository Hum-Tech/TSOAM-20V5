#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, cwd = process.cwd()) {
  try {
    log('cyan', `Running: ${command}`);
    const result = execSync(command, { 
      cwd, 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    return true;
  } catch (error) {
    log('red', `❌ Command failed: ${command}`);
    return false;
  }
}

async function deployProduction() {
  log('blue', '�� TSOAM Production Deployment Starting...');
  log('blue', '=' .repeat(60));

  let success = true;

  // 1. Install dependencies
  log('yellow', '\n📦 Installing Dependencies...');
  if (!exec('npm install')) success = false;
  if (!exec('npm install', 'client')) success = false;
  if (!exec('npm install', 'server')) success = false;

  // 2. Type checking
  log('yellow', '\n🔍 Type Checking...');
  if (!exec('npm run type-check', 'client')) success = false;

  // 3. Build client
  log('yellow', '\n🏗️  Building Client...');
  if (!exec('npm run build-only', 'client')) success = false;

  // 4. Check required files
  log('yellow', '\n📄 Checking Configuration...');
  
  const requiredFiles = [
    'client/dist/index.html',
    'server/server.js',
    'server/config/database.js',
    'server/config/sqlite-adapter.js'
  ];

  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      log('green', `✅ ${file}`);
    } else {
      log('red', `❌ Missing: ${file}`);
      success = false;
    }
  }

  // 5. Check environment configuration
  log('yellow', '\n⚙️  Environment Configuration...');
  
  if (!fs.existsSync('server/.env')) {
    log('yellow', '⚠️  Creating default .env file...');
    try {
      fs.copyFileSync('server/.env.example', 'server/.env');
      log('green', '✅ Created server/.env from example');
    } catch (error) {
      log('red', '❌ Failed to create .env file');
      success = false;
    }
  } else {
    log('green', '✅ Server environment configured');
  }

  // 6. Database check
  log('yellow', '\n🗄️  Database Configuration...');
  
  // Ensure uploads directory exists
  const uploadsDir = 'server/uploads';
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    log('green', '✅ Created uploads directory');
  }

  // Ensure database directory exists  
  const dbDir = 'server/database';
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    log('green', '✅ Created database directory');
  }

  log('green', '✅ SQLite database ready (automatic initialization)');

  // 7. Final verification
  log('yellow', '\n🔎 Final Verification...');
  
  if (success) {
    log('green', '🎉 DEPLOYMENT SUCCESSFUL!');
    log('blue', '\n📋 Deployment Summary:');
    log('blue', '   ✅ Dependencies installed');
    log('blue', '   ✅ TypeScript compiled');
    log('blue', '   ✅ Client built for production');
    log('blue', '   ✅ Environment configured');
    log('blue', '   ✅ Database ready (SQLite)');
    log('blue', '   ✅ File uploads configured');
    
    log('cyan', '\n🚀 Starting Commands:');
    log('cyan', '   Development: npm run dev');
    log('cyan', '   Production:  npm start');
    
    log('yellow', '\n🔗 Access URLs:');
    log('yellow', '   Frontend: http://localhost:5173 (dev) / http://localhost:3002 (prod)');
    log('yellow', '   Backend:  http://localhost:3002/api');
    
    log('green', '\n✅ System is ready for deployment!');
  } else {
    log('red', '❌ DEPLOYMENT FAILED!');
    log('red', 'Please fix the errors above and try again.');
    process.exit(1);
  }
}

// Run deployment
deployProduction().catch((error) => {
  log('red', `❌ Deployment error: ${error.message}`);
  process.exit(1);
});
