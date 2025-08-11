#!/usr/bin/env node

/**
 * TSOAM Production Organization Script
 * Organizes files, removes duplicates, and prepares system for production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('📂 TSOAM Production Organization Starting...\n');

// Directories to remove (duplicates and development-only)
const DIRS_TO_REMOVE = [
  'TSOAM',           // Duplicate folder
  'client/dist',     // Build artifacts
  'server/dist',     // Build artifacts  
  'node_modules',    // Dependencies (will be reinstalled)
  'client/node_modules',
  'server/node_modules',
  '.vscode',         // IDE files
  '.idea',           // IDE files
  'logs',            // Old logs
  'uploads/temp'     // Temporary uploads
];

// Files to remove (development and duplicate files)
const FILES_TO_REMOVE = [
  // Environment files (templates will be kept)
  '.env',
  '.env.local',
  'client/.env',
  'server/.env',
  
  // Build files
  'client/dist',
  'server/dist',
  'build',
  
  // Log files
  '*.log',
  'logs/*.log',
  
  // System files
  '.DS_Store',
  'Thumbs.db',
  'desktop.ini',
  
  // Development files
  'cleanup-system.js',
  'setup-system.js', 
  'verify-system.js',
  'start-tsoam.bat',
  'start-tsoam.sh',
  'server.js',      // Root server.js (keep server/server.js)
  
  // Documentation (keep essential ones)
  'AGENTS.md',
  'API_ERROR_FIX.md',
  'AUTH_ERROR_FIX.md',
  'deployment-check.md',
  'PRODUCTION_ENHANCEMENTS_SUMMARY.md',
  'PRODUCTION_PACKAGE_SUMMARY.md',
  'PRODUCTION_READINESS_REPORT.md',
  'PRODUCTION_READINESS.md',
  'PRODUCTION_READY_FINAL.md',
  'PRODUCTION_READY_STATUS.md',
  'PRODUCTION_READY_VERIFICATION.md',
  'ENHANCED_FEATURES.md',
  'HR_PERFORMANCE_ENTERPRISE_ENHANCEMENT.md',
  'SYSTEM_UPDATE_SUMMARY.md',
  'DEPLOYMENT_STATUS.md',
  'DATABASE_DEPLOYMENT_GUIDE.md',
  'DATABASE_INTEGRATION_STATUS.md',
  'DATABASE_TESTING_GUIDE.md'
];

// Essential files and directories to keep
const ESSENTIAL_STRUCTURE = {
  'client/': 'Frontend React application',
  'server/': 'Backend Node.js application', 
  'database/': 'Database schemas and migrations',
  'scripts/': 'Utility and maintenance scripts',
  'docs/': 'Essential documentation',
  'uploads/': 'File upload directory',
  'package.json': 'Main package configuration',
  'README.md': 'Main documentation',
  'LICENSE': 'License file',
  '.gitignore': 'Git ignore rules',
  '.env.production.template': 'Production environment template'
};

function removeFileOrDir(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.lstatSync(filePath);
      if (stats.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
        console.log(`🗑️  Removed directory: ${filePath}`);
      } else {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Removed file: ${filePath}`);
      }
      return true;
    }
  } catch (error) {
    console.log(`⚠️  Could not remove ${filePath}: ${error.message}`);
    return false;
  }
  return false;
}

function organizeClientStructure() {
  console.log('📱 Organizing client structure...');
  
  const clientDirs = [
    'client/src/components',
    'client/src/pages', 
    'client/src/services',
    'client/src/contexts',
    'client/src/hooks',
    'client/src/utils',
    'client/src/lib',
    'client/public',
    'client/dist'
  ];
  
  clientDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created: ${dir}`);
    }
  });
  
  // Move files to src if they're in client root
  const filesToMove = [
    { from: 'client/components', to: 'client/src/components' },
    { from: 'client/pages', to: 'client/src/pages' },
    { from: 'client/services', to: 'client/src/services' },
    { from: 'client/contexts', to: 'client/src/contexts' },
    { from: 'client/hooks', to: 'client/src/hooks' },
    { from: 'client/utils', to: 'client/src/utils' },
    { from: 'client/lib', to: 'client/src/lib' }
  ];
  
  filesToMove.forEach(({ from, to }) => {
    if (fs.existsSync(from) && !from.includes('/src/')) {
      if (!fs.existsSync(to)) {
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.renameSync(from, to);
        console.log(`📦 Moved: ${from} → ${to}`);
      }
    }
  });
}

function organizeServerStructure() {
  console.log('🖥️  Organizing server structure...');
  
  const serverDirs = [
    'server/src',
    'server/src/routes',
    'server/src/models', 
    'server/src/middleware',
    'server/src/config',
    'server/src/controllers',
    'server/src/utils',
    'server/dist'
  ];
  
  serverDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created: ${dir}`);
    }
  });
  
  // Move files to src if they're in server root
  const filesToMove = [
    { from: 'server/routes', to: 'server/src/routes' },
    { from: 'server/models', to: 'server/src/models' },
    { from: 'server/middleware', to: 'server/src/middleware' },
    { from: 'server/config', to: 'server/src/config' }
  ];
  
  filesToMove.forEach(({ from, to }) => {
    if (fs.existsSync(from) && !from.includes('/src/')) {
      if (!fs.existsSync(to)) {
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.renameSync(from, to);
        console.log(`📦 Moved: ${from} → ${to}`);
      }
    }
  });
}

function organizeDatabaseStructure() {
  console.log('🗄️  Organizing database structure...');
  
  const dbDirs = [
    'database/schemas',
    'database/migrations',
    'database/seeds',
    'database/backups'
  ];
  
  dbDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created: ${dir}`);
    }
  });
  
  // Move schema files to organized structure
  const schemaFiles = ['schema.sql', 'production_schema.sql', 'enterprise_schema.sql'];
  schemaFiles.forEach(file => {
    const oldPath = `database/${file}`;
    const newPath = `database/schemas/${file}`;
    if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`📦 Moved: ${oldPath} → ${newPath}`);
    }
  });
}

function organizeDocumentation() {
  console.log('📚 Organizing documentation...');
  
  const docsDir = 'docs';
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  // Essential docs to keep and organize
  const docsToKeep = [
    'INSTALLATION_GUIDE.md',
    'PROJECT_STRUCTURE.md', 
    'SYSTEM_DOCUMENTATION.md',
    'MAINTENANCE_GUIDE.md',
    'DEPLOYMENT_INSTRUCTIONS.md',
    'READY_FOR_DEPLOYMENT.md'
  ];
  
  docsToKeep.forEach(doc => {
    const oldPath = doc;
    const newPath = `docs/${doc}`;
    if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`📦 Moved: ${oldPath} → ${newPath}`);
    }
  });
}

function createProductionPackageJson() {
  console.log('📦 Creating production package.json...');
  
  // Read current package.json if it exists
  let currentPackage = {};
  if (fs.existsSync('package.json')) {
    currentPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  }
  
  const productionPackage = {
    ...currentPackage,
    name: 'tsoam-church-management',
    version: '1.0.0',
    description: 'TSOAM Church Management System - Production Ready',
    main: 'server/index.js',
    scripts: {
      ...currentPackage.scripts,
      start: 'node server/index.js',
      'build': 'npm run client:build && npm run server:build',
      'client:build': 'cd client && npm run build',
      'server:build': 'cd server && npm run build',
      'db:init': 'node database/init.sql',
      'db:migrate': 'node scripts/sync-database.js',
      'demo:disable': 'node scripts/manage-demo-data.js disable',
      'demo:enable': 'node scripts/manage-demo-data.js enable',
      'production:setup': 'node cleanup-for-production.js'
    },
    engines: {
      node: '>=18.0.0',
      npm: '>=8.0.0'
    }
  };
  
  fs.writeFileSync('package.json', JSON.stringify(productionPackage, null, 2));
  console.log('✅ Production package.json created');
}

function createDirectoryStructureMap() {
  const structureMap = `# TSOAM Production Directory Structure

## Root Structure
\`\`\`
tsoam-church-management/
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── contexts/          # React contexts
│   │   ├── hooks/             # Custom hooks
│   │   ├── utils/             # Utility functions
│   │   └── lib/               # Libraries and configurations
│   ├── public/                # Static assets
│   ├── package.json           # Frontend dependencies
│   └── vite.config.ts         # Build configuration
│
├── server/                    # Backend Node.js application
│   ├── src/
│   │   ├── routes/            # API routes
│   │   ├── models/            # Data models
│   │   ├── middleware/        # Express middleware
│   │   ├── config/            # Server configuration
│   │   ├── controllers/       # Route controllers
│   │   └── utils/             # Server utilities
│   ├── package.json           # Backend dependencies
│   └── index.js               # Server entry point
│
├── database/                  # Database related files
│   ├── schemas/               # Database schemas
│   ├── migrations/            # Database migrations
│   ├── seeds/                 # Seed data (development)
│   └── backups/               # Backup files
│
├── scripts/                   # Utility scripts
│   ├── manage-demo-data.js    # Demo data management
│   ├── sync-database.js       # Database synchronization
│   └── backup-database.js     # Backup utilities
│
├── docs/                      # Documentation
│   ├── INSTALLATION_GUIDE.md
│   ├── DEPLOYMENT_INSTRUCTIONS.md
│   └── MAINTENANCE_GUIDE.md
│
├── uploads/                   # File uploads directory
│   ├── documents/
│   ├── images/
│   └── exports/
│
├── package.json               # Main package configuration
├── .env.production.template   # Environment template
├── PRODUCTION-DEPLOYMENT-GUIDE.md
└── README.md                  # Main documentation
\`\`\`

## Key Production Files

### Configuration
- \`.env.production.template\` - Environment variables template
- \`package.json\` - Main application configuration
- \`client/package.json\` - Frontend dependencies
- \`server/package.json\` - Backend dependencies

### Database
- \`database/schemas/\` - Database structure definitions
- \`database/migrations/\` - Version controlled schema changes
- \`scripts/sync-database.js\` - Database synchronization tool

### Application
- \`client/src/\` - Frontend source code
- \`server/src/\` - Backend source code
- \`uploads/\` - File storage directory

### Utilities
- \`scripts/manage-demo-data.js\` - Toggle demo data
- \`cleanup-for-production.js\` - Production preparation
- \`organize-for-production.js\` - File organization

### Documentation
- \`PRODUCTION-DEPLOYMENT-GUIDE.md\` - Production setup guide
- \`docs/\` - Technical documentation
- \`README.md\` - Quick start guide

---
*Generated by TSOAM Production Organizer*
`;

  fs.writeFileSync('DIRECTORY-STRUCTURE.md', structureMap);
  console.log('📋 Directory structure map created');
}

// Main execution
console.log('🧹 Phase 1: Removing unnecessary files and directories...');
DIRS_TO_REMOVE.forEach(removeFileOrDir);
FILES_TO_REMOVE.forEach(removeFileOrDir);

console.log('\n📂 Phase 2: Organizing directory structure...');
organizeClientStructure();
organizeServerStructure();
organizeDatabaseStructure();
organizeDocumentation();

console.log('\n📦 Phase 3: Creating production configuration...');
createProductionPackageJson();
createDirectoryStructureMap();

console.log('\n✅ Production organization completed successfully!');
console.log('\n📊 Summary:');
console.log('   - Removed duplicate and development files');
console.log('   - Organized client/ directory structure');
console.log('   - Organized server/ directory structure');
console.log('   - Organized database/ directory structure');
console.log('   - Organized documentation');
console.log('   - Created production package.json');
console.log('   - Generated directory structure map');

console.log('\n🎯 Next Steps:');
console.log('1. Review the organized structure');
console.log('2. Configure environment variables (.env)');
console.log('3. Run database synchronization');
console.log('4. Build the application for production');
console.log('5. Deploy to your production server');

console.log('\n🎉 TSOAM is now organized and ready for production!');
