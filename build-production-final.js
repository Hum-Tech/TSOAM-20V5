#!/usr/bin/env node

/**
 * Production Build and Validation Script for TSOAM Church Management System
 * Performs complete build, error checking, and production readiness validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("🚀 TSOAM Church Management System - Production Build & Validation");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━��━━━━━━━━━━━━━━━━");

async function buildProduction() {
  try {
    // Step 1: Clean previous builds
    console.log("🧹 Step 1: Cleaning previous builds...");
    try {
      if (fs.existsSync('client/dist')) {
        execSync('rm -rf client/dist', { stdio: 'pipe' });
      }
    } catch (error) {
      console.log("   No previous build to clean");
    }
    console.log("✅ Build directories cleaned");

    // Step 2: Install dependencies
    console.log("📦 Step 2: Installing dependencies...");
    try {
      execSync('npm install', { stdio: 'pipe' });
      execSync('cd client && npm install', { stdio: 'pipe' });
      execSync('cd server && npm install', { stdio: 'pipe' });
      console.log("✅ All dependencies installed");
    } catch (error) {
      console.error("❌ Dependency installation failed:", error.message);
      process.exit(1);
    }

    // Step 3: TypeScript compilation check
    console.log("🔧 Step 3: TypeScript compilation check...");
    try {
      execSync('cd client && npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
      console.log("✅ TypeScript compilation successful");
    } catch (error) {
      console.error("❌ TypeScript compilation failed");
      console.error(error.stdout?.toString() || error.message);
      process.exit(1);
    }

    // Step 4: ESLint check
    console.log("🔍 Step 4: ESLint validation...");
    try {
      // Run ESLint but don't fail build on warnings
      execSync('cd client && npx eslint . --ext .ts,.tsx --max-warnings 100', { stdio: 'pipe' });
      console.log("✅ ESLint validation passed");
    } catch (error) {
      console.log("⚠️  ESLint found some issues (continuing build)");
    }

    // Step 5: Build client
    console.log("🏗️  Step 5: Building client application...");
    try {
      const buildOutput = execSync('cd client && npm run build-only', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      console.log("✅ Client build successful");
      
      // Check build size
      if (buildOutput.includes('(!) Some chunks are larger than')) {
        console.log("⚠️  Large chunk warning detected (acceptable for production)");
      }
    } catch (error) {
      console.error("❌ Client build failed:", error.message);
      process.exit(1);
    }

    // Step 6: Verify build output
    console.log("📊 Step 6: Verifying build output...");
    const distPath = path.join(__dirname, 'client/dist');
    if (!fs.existsSync(distPath)) {
      console.error("❌ Build output directory not found");
      process.exit(1);
    }

    const buildFiles = fs.readdirSync(distPath);
    const requiredFiles = ['index.html', 'assets'];
    const missingFiles = requiredFiles.filter(file => !buildFiles.includes(file));
    
    if (missingFiles.length > 0) {
      console.error("❌ Missing required build files:", missingFiles);
      process.exit(1);
    }

    console.log("✅ Build output verified");
    console.log(`   Files: ${buildFiles.length} items`);

    // Step 7: Server validation
    console.log("🖥️  Step 7: Server validation...");
    try {
      // Check server dependencies
      const serverPackagePath = path.join(__dirname, 'server/package.json');
      if (fs.existsSync(serverPackagePath)) {
        const serverPackage = JSON.parse(fs.readFileSync(serverPackagePath, 'utf8'));
        const requiredDeps = ['express', 'mysql2', 'bcrypt', 'cors'];
        const missingDeps = requiredDeps.filter(dep => !serverPackage.dependencies[dep]);
        
        if (missingDeps.length > 0) {
          console.error("❌ Missing server dependencies:", missingDeps);
          process.exit(1);
        }
      }
      console.log("✅ Server dependencies verified");
    } catch (error) {
      console.error("❌ Server validation failed:", error.message);
      process.exit(1);
    }

    // Step 8: Database initialization check
    console.log("🗄️  Step 8: Database initialization check...");
    try {
      const dbInitPath = path.join(__dirname, 'server/init-complete-db.js');
      if (!fs.existsSync(dbInitPath)) {
        console.error("❌ Database initialization script not found");
        process.exit(1);
      }
      console.log("✅ Database initialization script verified");
    } catch (error) {
      console.error("❌ Database check failed:", error.message);
      process.exit(1);
    }

    // Step 9: Environment configuration check
    console.log("⚙️  Step 9: Environment configuration check...");
    const envPath = path.join(__dirname, '.env');
    const serverEnvPath = path.join(__dirname, 'server/.env');
    
    if (!fs.existsSync(envPath)) {
      console.log("⚠️  Root .env file not found (will be created)");
      // Create default .env
      const defaultEnv = `# TSOAM Production Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=tsoam_church_db
PORT=3001
NODE_ENV=production
USE_SQLITE=false
`;
      fs.writeFileSync(envPath, defaultEnv);
      console.log("✅ Default .env file created");
    } else {
      console.log("✅ Root .env file exists");
    }

    if (!fs.existsSync(serverEnvPath)) {
      console.log("⚠️  Server .env file not found (will be created)");
      const serverEnv = `DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=tsoam_church_db
PORT=3001
NODE_ENV=production
USE_SQLITE=false
`;
      fs.writeFileSync(serverEnvPath, serverEnv);
      console.log("✅ Server .env file created");
    } else {
      console.log("✅ Server .env file exists");
    }

    // Step 10: Production readiness summary
    console.log("🎯 Step 10: Production readiness summary...");
    
    const checks = [
      '✅ TypeScript compilation successful',
      '✅ Client build completed without errors',
      '✅ Server dependencies verified',
      '✅ Database scripts ready',
      '✅ Environment configuration prepared',
      '✅ Build artifacts generated'
    ];

    console.log("\n📋 Production Readiness Checklist:");
    checks.forEach(check => console.log(`   ${check}`));

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 Production build completed successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🚀 Deployment Instructions:");
    console.log("   1. Ensure MySQL server is running on target system");
    console.log("   2. Run 'npm run mysql:production' to setup database");
    console.log("   3. Run 'npm start' to start the production server");
    console.log("   4. Access system at http://localhost:3001");
    console.log("   5. Login with admin@tsoam.org / admin123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    console.error("❌ Production build failed:", error.message);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔧 Check the error message above and resolve issues");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    process.exit(1);
  }
}

// Run production build
if (require.main === module) {
  buildProduction();
}

module.exports = { buildProduction };
