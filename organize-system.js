#!/usr/bin/env node

/**
 * TSOAM System Organization Script
 * Cleans up and organizes files for production deployment
 */

const fs = require('fs');
const path = require('path');

console.log("🧹 TSOAM System Organization - Cleaning up files and folders");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// Files and folders to remove (temporary, redundant, or development-only)
const filesToRemove = [
  // Temporary fix files
  'fix-admin-user.js',
  'fix-dependencies.bat',
  'fix-response-consumption.js',
  'test-auth.js',
  'test-database-operations.js',
  'test-database-sync.js',
  'test-mysql.js',
  
  // Duplicate/redundant documentation
  'API_ERROR_FIX.md',
  'AUTH_ERROR_FIX.md',
  'AUTHENTICATION_FIX_SUMMARY.md',
  'AUTHENTICATION_SECURITY_FIXED.md',
  'DATABASE_DEPLOYMENT_GUIDE.md',
  'DATABASE_INTEGRATION_STATUS.md',
  'DATABASE_TESTING_GUIDE.md',
  'DEPLOYMENT_READY_STATUS.md',
  'DEPLOYMENT_STATUS.md',
  'deployment-check.md',
  'ENHANCED_FEATURES.md',
  'HR_PERFORMANCE_ENTERPRISE_ENHANCEMENT.md',
  'INSTALLATION_GUIDE.md',
  'LOGIN_ERROR_FIXES.md',
  'MYSQL_DATABASE_SETUP_GUIDE.md',
  'MYSQL_SETUP_GUIDE.md',
  'MYSQL_SETUP_LOCALHOST.md',
  'PACKAGE_VERIFICATION.md',
  'PRODUCTION_DEPLOYMENT_FINAL.md',
  'PRODUCTION_ENHANCEMENTS_SUMMARY.md',
  'PRODUCTION_PACKAGE_SUMMARY.md',
  'PRODUCTION_READINESS_REPORT.md',
  'PRODUCTION_READINESS.md',
  'PRODUCTION_READY_FINAL.md',
  'PRODUCTION_READY_STATUS.md',
  'PRODUCTION_READY_VERIFICATION.md',
  'PRODUCTION-DEPLOYMENT-GUIDE.md',
  'PROJECT_STRUCTURE.md',
  'READY_FOR_DEPLOYMENT.md',
  'RELEASE_NOTES.md',
  'RESPONSE_BODY_FIX.md',
  'SYSTEM_DOCUMENTATION.md',
  'SYSTEM_READY.md',
  'SYSTEM_STATUS_FINAL.md',
  'SYSTEM_UPDATE_SUMMARY.md',
  'verify-login.md',
  
  // Duplicate build scripts
  'build-production-final.js',
  'build-production-simple.js',
  'cleanup-for-production.js',
  'cleanup-production-system.js',
  'cleanup-system.js',
  'organize-for-production.js',
  'deploy-database.js',
  'deploy-production.js',
  'setup-mysql-production.js',
  'setup-system.js',
  'setup-windows.bat',
  'setup.js',
  'start-production.js',
  'start-tsoam.bat',
  'start-tsoam.sh',
  
  // Verification scripts (redundant)
  'verify-mysql-compatibility.js',
  'verify-mysql.js',
  'verify-system.js',
  
  // Old package files
  'package.production.json',
  
  // Temporary route files
  'server/routes/demo.ts.disabled',
  'server/fix-admin-directly.js',
  
  // TSOAM subdirectory (seems like old version)
  'TSOAM',
  
  // Agents file
  'AGENTS.md'
];

// Folders to organize/move
const foldersToOrganize = {
  // Move all scripts to scripts folder
  'scripts-to-move': [
    'check-mysql.js',
    'database-init-complete.js',
    'install-dependencies.js'
  ]
};

function removeFiles() {
  console.log("🗑️  Removing temporary and redundant files...");
  
  let removedCount = 0;
  
  filesToRemove.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        if (fs.statSync(file).isDirectory()) {
          fs.rmSync(file, { recursive: true, force: true });
        } else {
          fs.unlinkSync(file);
        }
        console.log(`   ✅ Removed: ${file}`);
        removedCount++;
      } catch (error) {
        console.log(`   ❌ Failed to remove: ${file} (${error.message})`);
      }
    }
  });
  
  console.log(`✅ Removed ${removedCount} files/folders`);
}

function organizeScripts() {
  console.log("📁 Organizing scripts...");
  
  // Ensure scripts directory exists
  if (!fs.existsSync('scripts')) {
    fs.mkdirSync('scripts');
  }
  
  // Move scripts to scripts folder
  const scriptsToMove = [
    'check-mysql.js',
    'database-init-complete.js', 
    'install-dependencies.js'
  ];
  
  scriptsToMove.forEach(script => {
    if (fs.existsSync(script)) {
      try {
        const content = fs.readFileSync(script, 'utf8');
        fs.writeFileSync(path.join('scripts', script), content);
        fs.unlinkSync(script);
        console.log(`   ✅ Moved: ${script} → scripts/${script}`);
      } catch (error) {
        console.log(`   ❌ Failed to move: ${script} (${error.message})`);
      }
    }
  });
}

function updatePackageJsonScripts() {
  console.log("📝 Updating package.json scripts...");
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Update script paths
    if (packageJson.scripts) {
      if (packageJson.scripts['db:init']) {
        packageJson.scripts['db:init'] = 'node scripts/database-init-complete.js';
      }
      if (packageJson.scripts['mysql:setup']) {
        packageJson.scripts['mysql:setup'] = 'node scripts/database-init-complete.js';
      }
      if (packageJson.scripts['mysql:production']) {
        packageJson.scripts['mysql:production'] = 'node scripts/database-init-complete.js';
      }
      if (packageJson.scripts['mysql:check']) {
        packageJson.scripts['mysql:check'] = 'node scripts/check-mysql.js';
      }
      if (packageJson.scripts['install-deps']) {
        packageJson.scripts['install-deps'] = 'node scripts/install-dependencies.js';
      }
    }
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log("   ✅ Updated package.json script paths");
  } catch (error) {
    console.log(`   ❌ Failed to update package.json: ${error.message}`);
  }
}

function createProductionReadme() {
  console.log("📖 Creating production README...");
  
  const readmeContent = `# TSOAM Church Management System

A comprehensive church management system built for The Seed of Abraham Ministry (TSOAM).

## �� Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+ (or use SQLite fallback)
- npm or yarn

### Installation

1. **Clone/Download the repository**
   \`\`\`bash
   # Extract the downloaded files to your desired directory
   cd TSOAM-Church-Management
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm run install-deps
   \`\`\`

3. **Configure environment**
   \`\`\`bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your database credentials
   # For MySQL: Update DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
   # For SQLite: Set USE_SQLITE=true
   \`\`\`

4. **Initialize database**
   \`\`\`bash
   npm run db:init
   \`\`\`

5. **Build and start**
   \`\`\`bash
   npm run build
   npm start
   \`\`\`

6. **Access the application**
   - Open: http://localhost:3002
   - Setup: http://localhost:3002/setup (if login issues)
   - Login: admin@tsoam.org / admin123

## 📁 Project Structure

\`\`\`
TSOAM-Church-Management/
├── client/                 # React frontend application
├── server/                 # Express.js backend API
├── database/              # Database schemas and migrations  
├── scripts/               # Utility and setup scripts
├── docs/                  # Documentation
├── public/                # Static assets
├── .env.example          # Environment configuration template
├── package.json          # Root dependencies and scripts
└── README.md            # This file
\`\`\`

## 🔧 Available Scripts

- \`npm run install-deps\` - Install all dependencies
- \`npm run build\` - Build the application for production
- \`npm start\` - Start the production server
- \`npm run dev\` - Start development servers
- \`npm run db:init\` - Initialize/setup database
- \`npm run mysql:check\` - Check MySQL connection

## 🗄️ Database Setup

### Option 1: MySQL (Recommended)
1. Install MySQL 8.0+
2. Create a database for TSOAM
3. Update .env with your MySQL credentials
4. Run \`npm run db:init\`

### Option 2: SQLite (Fallback)
1. Set \`USE_SQLITE=true\` in .env
2. Run \`npm run db:init\`

## 🔐 Default Login

- **Email**: admin@tsoam.org
- **Password**: admin123

**⚠️ Important**: Change the default password after first login!

## 🆘 Troubleshooting

### Login Issues
1. Visit http://localhost:3002/setup
2. Click "Create Admin User"
3. Try logging in again

### Database Issues
1. Check MySQL is running
2. Verify .env credentials
3. Run \`npm run mysql:check\`

### Port Issues
- Default port: 3002
- Change PORT in .env if needed
- Ensure port is not in use

## 📞 Support

For support and questions:
- Email: admin@tsoam.org
- Documentation: ./docs/

## 📄 License

© 2025 The Seed of Abraham Ministry (TSOAM). All rights reserved.
`;

  fs.writeFileSync('README.md', readmeContent);
  console.log("   ✅ Created production README.md");
}

function createInstallationGuide() {
  console.log("📋 Creating installation guide...");
  
  if (!fs.existsSync('docs')) {
    fs.mkdirSync('docs');
  }
  
  const installGuide = `# TSOAM Installation Guide

## System Requirements

- **Node.js**: Version 18.0 or higher
- **Database**: MySQL 8.0+ (recommended) or SQLite (fallback)
- **Memory**: Minimum 2GB RAM
- **Storage**: 1GB free space
- **Operating System**: Windows, macOS, or Linux

## Step-by-Step Installation

### 1. Download and Extract
1. Download the TSOAM Church Management System package
2. Extract to your desired directory (e.g., \`C:\\TSOAM\` or \`/opt/tsoam\`)
3. Open terminal/command prompt in the extracted directory

### 2. Install Dependencies
\`\`\`bash
# Install all required dependencies
npm run install-deps

# This will install:
# - Root dependencies
# - Client (frontend) dependencies  
# - Server (backend) dependencies
\`\`\`

### 3. Database Setup

#### Option A: MySQL Setup (Recommended)
1. **Install MySQL 8.0+**
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Follow installation wizard
   - Remember your root password

2. **Create Database**
   \`\`\`sql
   CREATE DATABASE tsoam_church_db;
   \`\`\`

3. **Configure Environment**
   \`\`\`bash
   # Copy template
   cp .env.example .env
   
   # Edit .env file with your details:
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=tsoam_church_db
   \`\`\`

#### Option B: SQLite Setup (Fallback)
\`\`\`bash
# Edit .env file:
USE_SQLITE=true
\`\`\`

### 4. Initialize Database
\`\`\`bash
# Create tables and default data
npm run db:init
\`\`\`

### 5. Build Application
\`\`\`bash
# Build frontend for production
npm run build
\`\`\`

### 6. Start Server
\`\`\`bash
# Start production server
npm start
\`\`\`

### 7. Access Application
1. Open browser to: http://localhost:3002
2. If login issues, visit: http://localhost:3002/setup
3. Login with: admin@tsoam.org / admin123

## Windows Installation

### Using Command Prompt:
\`\`\`cmd
cd C:\\TSOAM
npm run install-deps
copy .env.example .env
# Edit .env with notepad
npm run db:init
npm run build
npm start
\`\`\`

### Using PowerShell:
\`\`\`powershell
Set-Location C:\\TSOAM
npm run install-deps
Copy-Item .env.example .env
# Edit .env with your preferred editor
npm run db:init
npm run build
npm start
\`\`\`

## Linux/macOS Installation

\`\`\`bash
cd /opt/tsoam
npm run install-deps
cp .env.example .env
# Edit .env with nano/vim/etc
nano .env
npm run db:init
npm run build
npm start
\`\`\`

## Troubleshooting

### Common Issues

1. **"Node not found"**
   - Install Node.js from https://nodejs.org
   - Restart terminal after installation

2. **"MySQL connection failed"**
   - Check MySQL is running
   - Verify credentials in .env
   - Use SQLite as fallback

3. **"Port already in use"**
   - Change PORT in .env
   - Stop other services using the port

4. **"Cannot login"**
   - Visit /setup page
   - Click "Create Admin User"
   - Clear browser cache

### Getting Help

1. Check logs in terminal
2. Visit setup page: /setup
3. Check environment configuration
4. Contact support: admin@tsoam.org

## Next Steps

1. Change default admin password
2. Create additional user accounts
3. Configure church information
4. Import member data
5. Set up regular backups

## Production Deployment

For production deployment on a server:

1. Use a process manager (PM2)
2. Set up reverse proxy (nginx)
3. Configure SSL certificates
4. Set up regular backups
5. Monitor system performance

See docs/DEPLOYMENT.md for detailed production setup.
`;

  fs.writeFileSync('docs/INSTALLATION.md', installGuide);
  console.log("   ✅ Created docs/INSTALLATION.md");
}

// Run organization
async function organize() {
  try {
    removeFiles();
    organizeScripts();
    updatePackageJsonScripts();
    createProductionReadme();
    createInstallationGuide();
    
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ System organization completed!");
    console.log("📁 Clean folder structure ready for download/deployment");
    console.log("📖 Updated documentation available in docs/");
    console.log("🚀 Ready for production use!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
  } catch (error) {
    console.error("❌ Organization failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  organize();
}

module.exports = { organize };
