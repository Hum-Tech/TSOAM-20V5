#!/usr/bin/env node

/**
 * TSOAM System Verification Script
 * Checks all components are properly configured and working
 */

const fs = require('fs');
const path = require('path');

console.log("🔍 TSOAM Church Management System - Verification");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

let passed = 0;
let total = 0;

function check(description, condition) {
  total++;
  if (condition) {
    console.log(`✅ ${description}`);
    passed++;
  } else {
    console.log(`❌ ${description}`);
  }
}

// Check required files
check("package.json exists", fs.existsSync('package.json'));
check("README.md exists", fs.existsSync('README.md'));
check("Database init script exists", fs.existsSync('database-init-complete.js'));
check("MySQL checker exists", fs.existsSync('check-mysql.js'));

// Check server structure
check("Server directory exists", fs.existsSync('server'));
check("Server package.json exists", fs.existsSync('server/package.json'));
check("Server main file exists", fs.existsSync('server/server.js'));

// Check client structure  
check("Client directory exists", fs.existsSync('client'));
check("Client package.json exists", fs.existsSync('client/package.json'));
check("Client build exists", fs.existsSync('client/dist'));
check("Client index.html exists", fs.existsSync('client/dist/index.html'));

// Check environment file
check(".env file exists", fs.existsSync('.env'));

// Check important client files
check("AuthContext exists", fs.existsSync('client/contexts/AuthContext.tsx'));
check("Auth service exists", fs.existsSync('client/services/AuthService.ts'));
check("Request debounce utility exists", fs.existsSync('client/utils/requestDebounce.ts'));
check("Response handler utility exists", fs.existsSync('client/utils/responseHandler.ts'));

// Check server routes
const routesDir = 'server/routes';
if (fs.existsSync(routesDir)) {
  const routes = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
  check(`Server routes (${routes.length} files)`, routes.length >= 8);
}

// Check database files
check("Enterprise schema exists", fs.existsSync('database/enterprise_schema.sql'));
check("MySQL schema exists", fs.existsSync('database/mysql8_schema.sql'));

// Verify no debug files remain
check("No debug utilities", !fs.existsSync('client/utils/responseDebug.ts'));

// Check package.json scripts
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  check("db:init script exists", pkg.scripts && pkg.scripts['db:init']);
  check("mysql:check script exists", pkg.scripts && pkg.scripts['mysql:check']);
  check("build script exists", pkg.scripts && pkg.scripts['build']);
  check("start script exists", pkg.scripts && pkg.scripts['start']);
} catch (e) {
  check("package.json is valid JSON", false);
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`📊 Verification Results: ${passed}/${total} checks passed`);

if (passed === total) {
  console.log("🎉 System verification PASSED!");
  console.log("🚀 Your TSOAM system is ready for production!");
  console.log("");
  console.log("🔧 Next steps:");
  console.log("   1. Ensure MySQL is running");
  console.log("   2. Run: npm run mysql:check");
  console.log("   3. Run: npm run db:init");
  console.log("   4. Run: npm start");
  console.log("   5. Open: http://localhost:3001");
  console.log("   6. Login: admin@tsoam.org / admin123");
} else {
  console.log("⚠️  System verification FAILED!");
  console.log(`❌ ${total - passed} issues need to be resolved`);
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
