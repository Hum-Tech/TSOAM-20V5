#!/usr/bin/env node

/**
 * TSOAM Demo Data Management Script
 * Easily toggle between demo data and production mode
 */

const fs = require('fs');
const path = require('path');

// Demo data markers for easy identification
const DEMO_START_MARKER = '/* DEMO_DATA_START';
const DEMO_END_MARKER = 'DEMO_DATA_END */';

// Files containing demo data
const DEMO_DATA_FILES = [
  {
    file: 'client/contexts/AuthContext.tsx',
    description: 'System users and accounts'
  },
  {
    file: 'client/pages/Dashboard.tsx', 
    description: 'Dashboard statistics and charts'
  },
  {
    file: 'client/pages/DashboardNew.tsx',
    description: 'Enhanced dashboard data'
  },
  {
    file: 'client/pages/Events.tsx',
    description: 'Church events and activities'
  },
  {
    file: 'client/pages/HR.tsx',
    description: 'HR employees and payroll data'
  },
  {
    file: 'client/pages/Finance.tsx',
    description: 'Financial transactions and reports'
  },
  {
    file: 'client/pages/MemberManagement.tsx',
    description: 'Church members database'
  },
  {
    file: 'client/pages/NewMembers.tsx',
    description: 'New members and candidates'
  },
  {
    file: 'client/pages/Inventory.tsx',
    description: 'Inventory items and stock'
  }
];

function showHelp() {
  console.log(`
📊 TSOAM Demo Data Management

Usage:
  node scripts/manage-demo-data.js [command]

Commands:
  enable    Enable demo data for development
  disable   Disable demo data for production
  status    Check current demo data status
  help      Show this help message

Examples:
  node scripts/manage-demo-data.js enable   # Enable demo data
  node scripts/manage-demo-data.js disable  # Disable for production
  node scripts/manage-demo-data.js status   # Check current status
`);
}

function checkDemoDataStatus() {
  console.log('📊 Checking demo data status...\n');
  
  const results = DEMO_DATA_FILES.map(({ file, description }) => {
    if (!fs.existsSync(file)) {
      return { file, description, status: 'FILE_NOT_FOUND', hasDemo: false };
    }
    
    const content = fs.readFileSync(file, 'utf8');
    const hasMarkers = content.includes(DEMO_START_MARKER);
    const isCommented = content.includes(DEMO_START_MARKER) && 
                       content.includes(DEMO_END_MARKER);
    
    let status;
    if (!hasMarkers) {
      status = 'NO_DEMO_MARKERS';
    } else if (isCommented) {
      status = 'DISABLED';
    } else {
      status = 'ENABLED';
    }
    
    return { file, description, status, hasDemo: hasMarkers };
  });
  
  // Display results
  results.forEach(({ file, description, status }) => {
    const icon = status === 'ENABLED' ? '✅' : 
                 status === 'DISABLED' ? '❌' : '⚠️';
    console.log(`${icon} ${file}`);
    console.log(`   ${description}`);
    console.log(`   Status: ${status}\n`);
  });
  
  const enabledCount = results.filter(r => r.status === 'ENABLED').length;
  const disabledCount = results.filter(r => r.status === 'DISABLED').length;
  
  console.log(`📈 Summary:`);
  console.log(`   Enabled: ${enabledCount} files`);
  console.log(`   Disabled: ${disabledCount} files`);
  console.log(`   Total: ${results.length} files\n`);
  
  if (enabledCount > 0 && disabledCount > 0) {
    console.log('⚠️  Mixed state detected! Some files have demo data enabled while others are disabled.');
  } else if (enabledCount > 0) {
    console.log('🔧 System is in DEVELOPMENT mode with demo data enabled.');
  } else if (disabledCount > 0) {
    console.log('🚀 System is in PRODUCTION mode with demo data disabled.');
  }
}

function enableDemoData() {
  console.log('🔧 Enabling demo data for development...\n');
  
  let processedCount = 0;
  
  DEMO_DATA_FILES.forEach(({ file, description }) => {
    if (!fs.existsSync(file)) {
      console.log(`⚠️  File not found: ${file}`);
      return;
    }
    
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if file has demo data markers
    if (!content.includes(DEMO_START_MARKER)) {
      console.log(`⚠️  No demo data markers in: ${file}`);
      return;
    }
    
    // Remove comment blocks around demo data
    const regex = new RegExp(`/\\*\\s*DEMO_DATA_START([\\s\\S]*?)DEMO_DATA_END\\s*\\*/`, 'g');
    const newContent = content.replace(regex, (match, demoContent) => {
      return `/* DEMO_DATA_START */${demoContent}/* DEMO_DATA_END */`;
    });
    
    if (newContent !== content) {
      fs.writeFileSync(file, newContent);
      console.log(`✅ Enabled demo data in: ${file}`);
      processedCount++;
    } else {
      console.log(`ℹ️  Demo data already enabled in: ${file}`);
    }
  });
  
  console.log(`\n🎉 Demo data enabled in ${processedCount} files!`);
  console.log('💡 System is now ready for development with sample data.');
}

function disableDemoData() {
  console.log('🚀 Disabling demo data for production...\n');
  
  let processedCount = 0;
  
  DEMO_DATA_FILES.forEach(({ file, description }) => {
    if (!fs.existsSync(file)) {
      console.log(`⚠️  File not found: ${file}`);
      return;
    }
    
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if file has demo data markers
    if (!content.includes(DEMO_START_MARKER)) {
      console.log(`⚠️  No demo data markers in: ${file}`);
      return;
    }
    
    // Add comment blocks around demo data
    const regex = new RegExp(`/\\*\\s*DEMO_DATA_START\\s*\\*/([\\s\\S]*?)/\\*\\s*DEMO_DATA_END\\s*\\*/`, 'g');
    const newContent = content.replace(regex, (match, demoContent) => {
      return `/* DEMO_DATA_START${demoContent}DEMO_DATA_END */`;
    });
    
    if (newContent !== content) {
      fs.writeFileSync(file, newContent);
      console.log(`✅ Disabled demo data in: ${file}`);
      processedCount++;
    } else {
      console.log(`ℹ️  Demo data already disabled in: ${file}`);
    }
  });
  
  console.log(`\n🎉 Demo data disabled in ${processedCount} files!`);
  console.log('🚀 System is now ready for production deployment.');
  console.log('💡 Remember to configure your production database and environment variables.');
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'enable':
    enableDemoData();
    break;
  case 'disable':
    disableDemoData();
    break;
  case 'status':
    checkDemoDataStatus();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    console.log('❌ Invalid command. Use "help" to see available commands.');
    showHelp();
    process.exit(1);
}
