const fs = require("fs");
const path = require("path");

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function verifySystem() {
  log('blue', '🔍 TSOAM System Verification Started');
  log('blue', '=' .repeat(50));
  
  let allChecks = true;

  // 1. Check if required directories exist
  log('yellow', '\n📁 Checking Directory Structure...');
  const requiredDirs = [
    'client',
    'server', 
    'server/database',
    'server/config',
    'server/routes',
    'server/models',
    'database'
  ];

  for (const dir of requiredDirs) {
    if (fs.existsSync(dir)) {
      log('green', `✅ ${dir}/`);
    } else {
      log('red', `❌ Missing: ${dir}/`);
      allChecks = false;
    }
  }

  // 2. Check if key files exist
  log('yellow', '\n📄 Checking Key Files...');
  const requiredFiles = [
    'package.json',
    'client/package.json',
    'server/package.json',
    'client/vite.config.ts',
    'server/server.js',
    'server/config/database.js',
    'server/database/schema.sql',
    '.env.production'
  ];

  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      log('green', `✅ ${file}`);
    } else {
      log('red', `❌ Missing: ${file}`);
      allChecks = false;
    }
  }

  // 3. Check client build
  log('yellow', '\n🏗️  Checking Client Build...');
  if (fs.existsSync('client/dist')) {
    const distFiles = fs.readdirSync('client/dist');
    if (distFiles.length > 0) {
      log('green', '✅ Client build exists');
    } else {
      log('red', '❌ Client build directory is empty');
      allChecks = false;
    }
  } else {
    log('red', '❌ Client build not found - run: cd client && npm run build-only');
    allChecks = false;
  }

  // 4. Check environment configuration
  log('yellow', '\n⚙️  Checking Environment Configuration...');
  
  if (fs.existsSync('server/.env')) {
    log('green', '✅ Server environment file exists');
  } else {
    log('yellow', '⚠️  Server .env not found - will use SQLite fallback');
  }

  if (fs.existsSync('.env.production')) {
    log('green', '✅ Production environment template exists');
  } else {
    log('red', '❌ Production environment template missing');
    allChecks = false;
  }

  // 5. Check node_modules
  log('yellow', '\n📦 Checking Dependencies...');
  
  if (fs.existsSync('node_modules')) {
    log('green', '✅ Root dependencies installed');
  } else {
    log('red', '❌ Root dependencies missing - run: npm install');
    allChecks = false;
  }

  if (fs.existsSync('client/node_modules')) {
    log('green', '✅ Client dependencies installed');
  } else {
    log('red', '❌ Client dependencies missing - run: cd client && npm install');
    allChecks = false;
  }

  if (fs.existsSync('server/node_modules')) {
    log('green', '✅ Server dependencies installed');
  } else {
    log('red', '❌ Server dependencies missing - run: cd server && npm install');
    allChecks = false;
  }

  // 6. Check SQLite database (fallback)
  log('yellow', '\n🗄️  Checking Database Configuration...');
  
  if (fs.existsSync('server/database/tsoam_church.db')) {
    log('green', '✅ SQLite database exists (fallback ready)');
  } else {
    log('yellow', '⚠️  SQLite database will be created on first run');
  }

  // 7. Check critical server files
  log('yellow', '\n🌐 Checking Server Configuration...');
  
  const serverFiles = [
    'server/models/User.js',
    'server/models/Employee.js',
    'server/routes/auth.js',
    'server/routes/hr.js',
    'server/middleware/auth.js'
  ];

  for (const file of serverFiles) {
    if (fs.existsSync(file)) {
      log('green', `✅ ${file}`);
    } else {
      log('red', `❌ Missing: ${file}`);
      allChecks = false;
    }
  }

  // Final result
  log('blue', '\n' + '=' .repeat(50));
  if (allChecks) {
    log('green', '🎉 System Verification PASSED');
    log('green', '✅ System is ready for deployment');
    log('blue', '\n📋 Deployment Commands:');
    log('blue', '   Development: npm run dev');
    log('blue', '   Production:  npm run build-production');
    log('blue', '   Start:       npm start');
  } else {
    log('red', '❌ System Verification FAILED');
    log('red', '⚠️  Please fix the issues above before deployment');
  }
  
  log('blue', '\n🔗 Database Connection:');
  log('blue', '   - MySQL: Configure .env in server/ directory');
  log('blue', '   - SQLite: Automatic fallback (no configuration needed)');
  log('blue', '   - Both support full CRUD operations');
  
  return allChecks;
}

// Run verification
verifySystem().catch(console.error);
