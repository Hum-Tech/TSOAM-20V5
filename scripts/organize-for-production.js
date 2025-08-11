#!/usr/bin/env node

/**
 * TSOAM Church Management System - Production File Organization Script
 * 
 * This script organizes the codebase for production deployment by:
 * - Removing unnecessary development files
 * - Organizing documentation
 * - Creating proper directory structure
 * - Generating deployment package
 * 
 * @author ZionSurf Development Team
 * @version 2.0.0
 * @since 2025-01-06
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Configuration for file organization
const CONFIG = {
  // Files and directories to remove for production
  removeForProduction: [
    // Development documentation files
    'API_ERROR_FIX.md',
    'AUTH_ERROR_FIX.md',
    'DATABASE_INTEGRATION_STATUS.md',
    'DATABASE_TESTING_GUIDE.md',
    'DEPLOYMENT_STATUS.md',
    'ENHANCED_FEATURES.md',
    'HR_PERFORMANCE_ENTERPRISE_ENHANCEMENT.md',
    'PRODUCTION_ENHANCEMENTS_SUMMARY.md',
    'PRODUCTION_READINESS_REPORT.md',
    'PRODUCTION_READINESS.md',
    'PRODUCTION_READY_FINAL.md',
    'PRODUCTION_READY_STATUS.md',
    'PRODUCTION_READY_VERIFICATION.md',
    'SYSTEM_UPDATE_SUMMARY.md',
    
    // Development build files
    'build-production-simple.js',
    'cleanup-system.js',
    'setup-system.js',
    
    // Temporary directories
    'temp',
    'logs',
    'production-build',
    
    // Node modules (will be reinstalled)
    'node_modules',
    'client/node_modules',
    'server/node_modules',
    
    // Git directory for clean package
    '.git',
    '.gitignore',
    
    // Development tools
    '.prettierrc',
    '.npmrc',
    
    // Backup files
    'backups',
    'uploads'
  ],
  
  // Important files to keep
  keepFiles: [
    'README.md',
    'package.json',
    'package-lock.json',
    '.env.example',
    '.env.production',
    'DATABASE_DEPLOYMENT_GUIDE.md',
    'INSTALLATION_GUIDE.md',
    'PROJECT_STRUCTURE.md',
    'READY_FOR_DEPLOYMENT.md',
    'SYSTEM_DOCUMENTATION.md',
    'components.json',
    'tailwind.config.ts',
    'tsconfig.json',
    'vite.config.ts',
    'postcss.config.js',
    'start-tsoam.bat',
    'start-tsoam.sh'
  ],
  
  // Directory structure for organized package
  directories: {
    'docs': 'Documentation and guides',
    'scripts': 'Build and maintenance scripts',
    'database': 'Database schemas and migrations',
    'client': 'Frontend React application',
    'server': 'Backend Node.js API',
    'shared': 'Shared utilities and types'
  }
};

/**
 * Log messages with timestamps
 */
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
}

/**
 * Check if file/directory exists
 */
async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove files and directories safely
 */
async function removeIfExists(filePath) {
  try {
    if (await exists(filePath)) {
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        await fs.rmdir(filePath, { recursive: true });
        log(`Removed directory: ${filePath}`);
      } else {
        await fs.unlink(filePath);
        log(`Removed file: ${filePath}`);
      }
    }
  } catch (error) {
    log(`Failed to remove ${filePath}: ${error.message}`, 'WARN');
  }
}

/**
 * Create directory if it doesn't exist
 */
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Copy file with directory creation
 */
async function copyFile(src, dest) {
  try {
    await ensureDir(path.dirname(dest));
    await fs.copyFile(src, dest);
    log(`Copied: ${src} -> ${dest}`);
  } catch (error) {
    log(`Failed to copy ${src}: ${error.message}`, 'ERROR');
  }
}

/**
 * Create production README
 */
async function createProductionReadme() {
  const readmeContent = `# TSOAM Church Management System - Production Package

**Professional Church Management System with ZionSurf Branding**

## 📦 Package Contents

This production package contains all files necessary to deploy and run the TSOAM Church Management System in a production environment.

### Directory Structure
\`\`\`
tsoam-church-management-system/
├── client/                 # Frontend React application
├── server/                 # Backend Node.js API  
├── database/              # Database schemas and scripts
├── docs/                  # Documentation and guides
├── scripts/               # Deployment and maintenance scripts
├── shared/                # Shared utilities
├── README.md              # This file
├── package.json           # Project configuration
└── .env.example          # Environment configuration template
\`\`\`

## 🚀 Quick Start

1. **Extract and Install**
   \`\`\`bash
   unzip tsoam-church-management-system.zip
   cd tsoam-church-management-system
   npm run install-all
   \`\`\`

2. **Configure Environment**
   \`\`\`bash
   cp .env.example .env.production
   # Edit .env.production with your settings
   \`\`\`

3. **Setup Database**
   \`\`\`bash
   npm run create-db
   npm run import-schema
   \`\`\`

4. **Clean Demo Data** 
   \`\`\`bash
   npm run cleanup-demo-data
   \`\`\`

5. **Start System**
   \`\`\`bash
   npm run dev
   \`\`\`

## 📚 Documentation

- **[Installation Guide](docs/INSTALLATION_GUIDE.md)** - Complete setup instructions
- **[Demo Data Cleanup](docs/DEMO_DATA_CLEANUP.md)** - Remove demo data before production
- **[Database Deployment](docs/DATABASE_DEPLOYMENT_GUIDE.md)** - Database setup and configuration
- **[System Documentation](docs/SYSTEM_DOCUMENTATION.md)** - Complete system overview
- **[API Reference](docs/API_REFERENCE.md)** - Backend API documentation

## 🔧 Configuration

See \`docs/INSTALLATION_GUIDE.md\` for detailed configuration instructions.

## 🆘 Support

For technical support:
- Email: support@zionsurf.com
- Documentation: See \`docs/\` directory

---

**© 2025 ZIONSURF. All rights reserved.**

Built for church communities with ❤️
`;

  await fs.writeFile('README-PRODUCTION.md', readmeContent);
  log('Created production README');
}

/**
 * Organize documentation files
 */
async function organizeDocumentation() {
  await ensureDir('docs');
  
  const docFiles = [
    'DATABASE_DEPLOYMENT_GUIDE.md',
    'INSTALLATION_GUIDE.md', 
    'PROJECT_STRUCTURE.md',
    'READY_FOR_DEPLOYMENT.md',
    'SYSTEM_DOCUMENTATION.md'
  ];
  
  for (const file of docFiles) {
    if (await exists(file)) {
      await copyFile(file, `docs/${file}`);
      await removeIfExists(file);
    }
  }
  
  // Move the demo cleanup guide
  if (await exists('docs/DEMO_DATA_CLEANUP.md')) {
    log('Demo cleanup guide already in docs/');
  }
}

/**
 * Clean up development files
 */
async function cleanupDevFiles() {
  log('Removing development files...');
  
  for (const item of CONFIG.removeForProduction) {
    await removeIfExists(item);
  }
}

/**
 * Create deployment scripts directory
 */
async function organizeScripts() {
  await ensureDir('scripts');
  
  // Scripts should already be in scripts/ directory
  // Just ensure the cleanup script has proper permissions
  try {
    if (await exists('scripts/cleanup-demo-data.js')) {
      await fs.chmod('scripts/cleanup-demo-data.js', 0o755);
      log('Set executable permissions on cleanup script');
    }
  } catch (error) {
    log(`Failed to set script permissions: ${error.message}`, 'WARN');
  }
}

/**
 * Create final package structure
 */
async function createPackageStructure() {
  // Ensure all required directories exist
  for (const [dir, description] of Object.entries(CONFIG.directories)) {
    await ensureDir(dir);
    
    // Create README in each directory explaining its purpose
    const dirReadme = `# ${dir.charAt(0).toUpperCase() + dir.slice(1)} Directory

${description}

This directory contains essential files for the TSOAM Church Management System.
Do not modify or remove files unless you understand their purpose.

---
© 2025 ZIONSURF. All rights reserved.
`;
    
    if (!(await exists(`${dir}/README.md`))) {
      await fs.writeFile(`${dir}/README.md`, dirReadme);
    }
  }
}

/**
 * Generate file manifest
 */
async function generateManifest() {
  const manifestContent = {
    name: "TSOAM Church Management System",
    version: "2.0.0",
    packageDate: new Date().toISOString(),
    description: "Production-ready church management system",
    author: "ZionSurf Development Team",
    
    directories: CONFIG.directories,
    
    importantFiles: {
      "README.md": "Main documentation and quick start guide",
      "package.json": "Project configuration and dependencies",
      ".env.example": "Environment configuration template",
      "docs/DEMO_DATA_CLEANUP.md": "Guide to remove demo data before production",
      "docs/INSTALLATION_GUIDE.md": "Complete installation instructions",
      "scripts/cleanup-demo-data.js": "Demo data cleanup script"
    },
    
    nextSteps: [
      "1. Read README.md for quick start instructions",
      "2. Follow docs/INSTALLATION_GUIDE.md for complete setup",
      "3. Configure environment variables using .env.example",
      "4. Run 'npm run cleanup-demo-data' before production use",
      "5. Test system thoroughly before going live"
    ],
    
    support: {
      email: "support@zionsurf.com",
      documentation: "docs/",
      website: "https://zionsurf.com"
    }
  };
  
  await fs.writeFile('PACKAGE_MANIFEST.json', JSON.stringify(manifestContent, null, 2));
  log('Generated package manifest');
}

/**
 * Validate package integrity
 */
async function validatePackage() {
  log('Validating package integrity...');
  
  const requiredFiles = [
    'README.md',
    'package.json',
    'client/package.json',
    'server/package.json',
    'database/schema.sql',
    'docs/DEMO_DATA_CLEANUP.md',
    'scripts/cleanup-demo-data.js'
  ];
  
  let isValid = true;
  
  for (const file of requiredFiles) {
    if (!(await exists(file))) {
      log(`Missing required file: ${file}`, 'ERROR');
      isValid = false;
    }
  }
  
  if (isValid) {
    log('Package validation passed ✅');
  } else {
    log('Package validation failed ❌', 'ERROR');
    throw new Error('Package validation failed');
  }
}

/**
 * Main organization function
 */
async function organizeForProduction() {
  try {
    log('Starting production file organization...');
    
    // Create production structure
    await createPackageStructure();
    
    // Organize documentation
    await organizeDocumentation();
    
    // Organize scripts
    await organizeScripts();
    
    // Create production README
    await createProductionReadme();
    
    // Generate manifest
    await generateManifest();
    
    // Clean up development files (do this last)
    await cleanupDevFiles();
    
    // Validate final package
    await validatePackage();
    
    log('✅ Production organization completed successfully!');
    log('');
    log('📦 Your production package is ready!');
    log('');
    log('Next steps:');
    log('1. Review the generated README-PRODUCTION.md');
    log('2. Test the package in a clean environment');
    log('3. Create deployment archive if needed');
    log('4. Follow deployment instructions in docs/');
    
  } catch (error) {
    log(`❌ Organization failed: ${error.message}`, 'ERROR');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  organizeForProduction();
}

module.exports = {
  organizeForProduction,
  CONFIG
};
