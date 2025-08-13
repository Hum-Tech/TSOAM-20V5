#!/usr/bin/env node

/**
 * Production System Cleanup Script for TSOAM Church Management System
 * Removes irrelevant files and organizes the system for clean deployment
 */

const fs = require('fs');
const path = require('path');

console.log("🧹 TSOAM System Cleanup - Preparing for Production Deployment");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// Files and directories to remove
const filesToRemove = [
  // Temporary and test files
  'fix-admin-user.js',
  'test-auth.js',
  'test-mysql.js',
  'verify-mysql.js',
  'verify-login.md',
  
  // Duplicate documentation
  'MYSQL_SETUP_LOCALHOST.md',
  'PRODUCTION_DEPLOYMENT_FINAL.md',
  'PRODUCTION-DEPLOYMENT-GUIDE.md',
  'SYSTEM_STATUS_FINAL.md',
  'AUTHENTICATION_SECURITY_FIXED.md',
  'LOGIN_ERROR_FIXES.md',
  'DIRECTORY-STRUCTURE.md',
  
  // Build and setup scripts (keeping essential ones)
  'build-production-simple.js',
  'cleanup-for-production.js',
  'organize-for-production.js',
  'setup-system.js',
  'setup.js',
  'deploy-production.js',
  'deploy-database.js',
  'verify-system.js',
  
  // Old database files
  'server.js', // Root level server.js (we have server/server.js)
  
  // Batch files
  'start-tsoam.bat',
  'start-tsoam.sh',
  
  // Documentation files (keep essential ones in docs/)
  'API_ERROR_FIX.md',
  'AUTH_ERROR_FIX.md',
  'DATABASE_DEPLOYMENT_GUIDE.md',
  'DATABASE_INTEGRATION_STATUS.md',
  'DATABASE_TESTING_GUIDE.md',
  'DEPLOYMENT_READY_STATUS.md',
  'DEPLOYMENT_STATUS.md',
  'deployment-check.md',
  'ENHANCED_FEATURES.md',
  'HR_PERFORMANCE_ENTERPRISE_ENHANCEMENT.md',
  'INSTALLATION_GUIDE.md',
  'PRODUCTION_ENHANCEMENTS_SUMMARY.md',
  'PRODUCTION_PACKAGE_SUMMARY.md',
  'PRODUCTION_READINESS_REPORT.md',
  'PRODUCTION_READINESS.md',
  'PRODUCTION_READY_FINAL.md',
  'PRODUCTION_READY_STATUS.md',
  'PRODUCTION_READY_VERIFICATION.md',
  'PROJECT_STRUCTURE.md',
  'READY_FOR_DEPLOYMENT.md',
  'SYSTEM_DOCUMENTATION.md',
  'SYSTEM_UPDATE_SUMMARY.md',
  
  // Netlify specific files (if not using Netlify)
  'netlify.toml',
  'netlify/',
  
  // Package files
  'package.production.json',
  
  // Build files
  'build-production-simple.js',
  'cleanup-system.js',
  
  // Archive creation script
  'TSOAM/create-archive.js'
];

// Directories to remove or clean
const directoriesToClean = [
  'docs/', // Will recreate with essential docs only
  'scripts/', // Remove old scripts
  'TSOAM/', // Duplicate directory
  'public/', // If not needed
  'shared/', // If empty or unnecessary
];

// Essential files to keep
const essentialFiles = [
  'package.json',
  'package-lock.json',
  '.env',
  '.env.example',
  '.env.local',
  '.env.production',
  '.gitignore',
  '.npmrc',
  '.prettierrc',
  'components.json',
  'postcss.config.js',
  'tailwind.config.ts',
  'tsconfig.json',
  'vite.config.server.ts',
  'vite.config.ts',
  'index.html',
  'README.md',
  
  // Our new optimized files
  'setup-mysql-production.js',
  'start-production.js',
  'build-production-final.js',
  'database/mysql8_schema.sql',
  'server/init-mysql8-db.js',
  'MYSQL_DATABASE_SETUP_GUIDE.md'
];

function cleanupFiles() {
  console.log("🗑️  Step 1: Removing unnecessary files...");
  
  let removedCount = 0;
  
  filesToRemove.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        if (fs.statSync(file).isDirectory()) {
          fs.rmSync(file, { recursive: true, force: true });
        } else {
          fs.unlinkSync(file);
        }
        console.log(`   ❌ Removed: ${file}`);
        removedCount++;
      } catch (error) {
        console.warn(`   ⚠️  Could not remove ${file}: ${error.message}`);
      }
    }
  });
  
  console.log(`✅ Removed ${removedCount} unnecessary files`);
}

function cleanupDirectories() {
  console.log("📁 Step 2: Cleaning directories...");
  
  // Clean scripts directory - keep only essential scripts
  if (fs.existsSync('scripts/')) {
    const scriptsToKeep = [
      'build-optimize.js',
      'cleanup-demo-data.js'
    ];
    
    const scriptFiles = fs.readdirSync('scripts/');
    scriptFiles.forEach(file => {
      if (!scriptsToKeep.includes(file)) {
        try {
          fs.unlinkSync(path.join('scripts/', file));
          console.log(`   ❌ Removed script: scripts/${file}`);
        } catch (error) {
          console.warn(`   ⚠️  Could not remove scripts/${file}`);
        }
      }
    });
  }
  
  // Clean docs directory and recreate with essential docs
  if (fs.existsSync('docs/')) {
    fs.rmSync('docs/', { recursive: true, force: true });
  }
  fs.mkdirSync('docs/', { recursive: true });
  
  console.log("✅ Directories cleaned");
}

function createEssentialDocs() {
  console.log("📚 Step 3: Creating essential documentation...");
  
  // Create README.md for docs
  const docsReadme = `# TSOAM Church Management System Documentation

## Quick Start

1. **Setup Database:**
   \`\`\`bash
   npm run mysql:setup
   \`\`\`

2. **Start System:**
   \`\`\`bash
   npm start
   \`\`\`

3. **Access System:**
   - URL: http://localhost:3001
   - Admin: admin@tsoam.org / admin123

## Files Structure

- \`/client/\` - Frontend React application
- \`/server/\` - Backend Express.js API
- \`/database/\` - Database schemas and migrations
- \`package.json\` - Project dependencies and scripts

## Production Deployment

Run the production build script:
\`\`\`bash
npm run build-production
npm run mysql:production
npm start
\`\`\`

## Support

For technical support, contact the development team.
`;

  fs.writeFileSync('docs/README.md', docsReadme);
  
  // Create deployment guide
  const deploymentGuide = `# Production Deployment Guide

## Prerequisites

- Node.js 18+
- MySQL 8.0+
- NPM or Yarn

## Quick Deployment

1. Extract system files
2. Install dependencies: \`npm install\`
3. Configure environment: Copy \`.env.example\` to \`.env\`
4. Setup database: \`npm run mysql:production\`
5. Build system: \`npm run build-production\`
6. Start server: \`npm start\`

## Default Credentials

- Email: admin@tsoam.org
- Password: admin123

**⚠️ Change default password after first login in production!**
`;

  fs.writeFileSync('docs/DEPLOYMENT.md', deploymentGuide);
  
  console.log("✅ Essential documentation created");
}

function optimizePackageJson() {
  console.log("📦 Step 4: Optimizing package.json...");
  
  const packagePath = 'package.json';
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Keep only essential scripts
    const essentialScripts = {
      "setup": "npm install && cd client && npm install && cd ../server && npm install",
      "build": "npm run build-production",
      "build-production": "node build-production-final.js",
      "start": "node start-production.js",
      "start:direct": "node server/server.js",
      "dev": "concurrently \"cd client && npm run dev\" \"cd server && npm run dev\"",
      "mysql:production": "node setup-mysql-production.js",
      "mysql:setup": "cd server && node init-mysql8-db.js",
      "db:init": "npm run mysql:setup",
      "health-check": "curl -f http://localhost:3001/api/health || exit 1",
      "test": "echo \"No tests specified\" && exit 0"
    };
    
    packageJson.scripts = essentialScripts;
    
    // Update description
    packageJson.description = "TSOAM Church Management System - Production Ready";
    
    // Clean up unnecessary fields
    delete packageJson.devDependencies?.concurrently; // Keep if needed
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log("✅ package.json optimized");
  }
}

function createProductionReadme() {
  console.log("📝 Step 5: Creating production README...");
  
  const readmeContent = `# TSOAM Church Management System

A comprehensive church management solution built with React, Node.js, and MySQL.

## Features

- 👥 Member Management
- 💰 Financial Tracking
- 📅 Event Scheduling
- 💬 Internal Messaging
- 📊 Dashboard Analytics
- 🏥 Welfare Management
- 👨‍💼 HR Management
- 📦 Inventory Tracking

## Quick Start

### 1. Installation
\`\`\`bash
npm run setup
\`\`\`

### 2. Database Setup
\`\`\`bash
npm run mysql:production
\`\`\`

### 3. Start System
\`\`\`bash
npm start
\`\`\`

### 4. Access Application
- URL: http://localhost:3001
- Admin Login: admin@tsoam.org / admin123

## Requirements

- Node.js 18+
- MySQL 8.0+
- Modern web browser

## Production Deployment

1. Extract files to production server
2. Run \`npm run setup\` to install dependencies
3. Configure \`.env\` file with production settings
4. Run \`npm run mysql:production\` to setup database
5. Run \`npm run build-production\` to build optimized version
6. Start with \`npm start\`

## Support

For technical support or questions, contact the development team.

## Security

- Change default admin password after first login
- Configure firewall rules for database access
- Use HTTPS in production environment
- Regular database backups recommended

---

© 2024 TSOAM Church International. All rights reserved.
`;

  fs.writeFileSync('README.md', readmeContent);
  console.log("✅ Production README created");
}

function showCleanupSummary() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 System Cleanup Complete!");
  console.log("��━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Count remaining files
  const remainingFiles = fs.readdirSync('.').filter(item => {
    const stat = fs.statSync(item);
    return stat.isFile();
  });
  
  const remainingDirs = fs.readdirSync('.').filter(item => {
    const stat = fs.statSync(item);
    return stat.isDirectory() && !item.startsWith('.');
  });
  
  console.log("📊 Cleanup Summary:");
  console.log(`   Files in root: ${remainingFiles.length}`);
  console.log(`   Directories: ${remainingDirs.length}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📁 Remaining Structure:");
  console.log("   📁 client/          - Frontend React application");
  console.log("   📁 server/          - Backend Express.js API");
  console.log("   📁 database/        - Database schemas and setup");
  console.log("   📁 docs/            - Essential documentation");
  console.log("   📄 package.json     - Project configuration");
  console.log("   📄 README.md        - Quick start guide");
  console.log("   📄 .env             - Environment configuration");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ System is now clean and ready for production deployment");
  console.log("🚀 Next steps:");
  console.log("   1. Run: npm run mysql:production");
  console.log("   2. Run: npm start");
  console.log("   3. Access: http://localhost:3001");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

// Execute cleanup
async function runCleanup() {
  try {
    cleanupFiles();
    cleanupDirectories();
    createEssentialDocs();
    optimizePackageJson();
    createProductionReadme();
    showCleanupSummary();
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
    process.exit(1);
  }
}

// Run cleanup
if (require.main === module) {
  runCleanup();
}

module.exports = { runCleanup };
