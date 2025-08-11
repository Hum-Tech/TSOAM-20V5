#!/usr/bin/env node

/**
 * TSOAM Church Management System - Demo Data Cleanup Script
 * 
 * This script removes all demo/sample data from the system to prepare
 * it for production use. It preserves system structure and configuration
 * while removing test data.
 * 
 * IMPORTANT: Always backup your database before running this script!
 * 
 * Usage: node scripts/cleanup-demo-data.js [options]
 * Options:
 *   --module <name>  Clean specific module only
 *   --dry-run       Show what would be cleaned without actually doing it
 *   --force         Skip confirmation prompt
 * 
 * @author ZionSurf Development Team
 * @version 2.0.0
 * @since 2025-01-06
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

// Configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tsoam_church',
  multipleStatements: true
};

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForced = args.includes('--force');
const moduleIndex = args.indexOf('--module');
const specificModule = moduleIndex !== -1 ? args[moduleIndex + 1] : null;

/**
 * Demo data cleanup queries organized by module
 * Each module contains queries to identify and remove demo data
 */
const CLEANUP_QUERIES = {
  appointments: {
    name: 'Appointments',
    description: 'Demo appointments and schedules',
    queries: [
      "DELETE FROM appointments WHERE title LIKE '%Demo%' OR title LIKE '%Sample%' OR title LIKE '%Test%' OR member_name LIKE '%Demo%'",
      "ALTER TABLE appointments AUTO_INCREMENT = 1"
    ]
  },
  
  members: {
    name: 'Members',
    description: 'Demo member profiles and visitors',
    queries: [
      "DELETE FROM members WHERE first_name LIKE '%Demo%' OR last_name LIKE '%Sample%' OR email LIKE '%demo%' OR email LIKE '%test%'",
      "DELETE FROM visitors WHERE first_name LIKE '%Demo%' OR last_name LIKE '%Sample%' OR email LIKE '%demo%'",
      "ALTER TABLE members AUTO_INCREMENT = 1",
      "ALTER TABLE visitors AUTO_INCREMENT = 1"
    ]
  },
  
  financial: {
    name: 'Financial Transactions',
    description: 'Demo financial records and transactions',
    queries: [
      "DELETE FROM financial_transactions WHERE description LIKE '%Demo%' OR description LIKE '%Sample%' OR description LIKE '%Test%'",
      "DELETE FROM budget_items WHERE item_name LIKE '%Demo%' OR item_name LIKE '%Sample%'",
      "ALTER TABLE financial_transactions AUTO_INCREMENT = 1",
      "ALTER TABLE budget_items AUTO_INCREMENT = 1"
    ]
  },
  
  inventory: {
    name: 'Inventory Items',
    description: 'Demo inventory and stock items',
    queries: [
      "DELETE FROM inventory_items WHERE item_name LIKE '%Demo%' OR item_name LIKE '%Sample%' OR notes LIKE '%demo%'",
      "DELETE FROM stock_items WHERE item_name LIKE '%Demo%' OR item_name LIKE '%Sample%' OR notes LIKE '%demo%'",
      "DELETE FROM stock_movements WHERE reference_number LIKE '%DEMO%' OR notes LIKE '%demo%'",
      "ALTER TABLE inventory_items AUTO_INCREMENT = 1",
      "ALTER TABLE stock_items AUTO_INCREMENT = 1",
      "ALTER TABLE stock_movements AUTO_INCREMENT = 1"
    ]
  },
  
  events: {
    name: 'Events',
    description: 'Demo events and activities',
    queries: [
      "DELETE FROM events WHERE title LIKE '%Demo%' OR title LIKE '%Sample%' OR description LIKE '%demo%'",
      "DELETE FROM event_attendees WHERE notes LIKE '%demo%'",
      "ALTER TABLE events AUTO_INCREMENT = 1",
      "ALTER TABLE event_attendees AUTO_INCREMENT = 1"
    ]
  },
  
  hr: {
    name: 'HR Records',
    description: 'Demo employee records and HR data',
    queries: [
      "DELETE FROM employees WHERE first_name LIKE '%Demo%' OR last_name LIKE '%Sample%' OR email LIKE '%demo%'",
      "DELETE FROM payroll_records WHERE notes LIKE '%demo%'",
      "DELETE FROM leave_requests WHERE reason LIKE '%demo%' OR reason LIKE '%test%'",
      "ALTER TABLE employees AUTO_INCREMENT = 1",
      "ALTER TABLE payroll_records AUTO_INCREMENT = 1",
      "ALTER TABLE leave_requests AUTO_INCREMENT = 1"
    ]
  },
  
  welfare: {
    name: 'Welfare Applications',
    description: 'Demo welfare applications and support records',
    queries: [
      "DELETE FROM welfare_applications WHERE applicant_name LIKE '%Demo%' OR applicant_name LIKE '%Sample%'",
      "DELETE FROM welfare_distributions WHERE notes LIKE '%demo%'",
      "ALTER TABLE welfare_applications AUTO_INCREMENT = 1",
      "ALTER TABLE welfare_distributions AUTO_INCREMENT = 1"
    ]
  },
  
  users: {
    name: 'User Accounts',
    description: 'Demo user accounts (preserves admin)',
    queries: [
      "DELETE FROM users WHERE username LIKE '%demo%' OR username LIKE '%test%' OR email LIKE '%demo%' OR email LIKE '%test%'",
      "DELETE FROM user_sessions WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'admin')"
    ]
  }
};

/**
 * Create readline interface for user input
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Promisify readline question
 */
const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

/**
 * Log message with timestamp
 */
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type}] ${message}`;
  console.log(logMessage);
  
  // Also write to log file
  appendToLogFile(logMessage);
}

/**
 * Append message to log file
 */
async function appendToLogFile(message) {
  try {
    const logDir = path.join(__dirname, '../logs');
    await fs.mkdir(logDir, { recursive: true });
    
    const logFile = path.join(logDir, 'cleanup.log');
    await fs.appendFile(logFile, message + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error.message);
  }
}

/**
 * Create database backup before cleanup
 */
async function createBackup(connection) {
  try {
    log('Creating database backup...');
    
    const backupDir = path.join(__dirname, '../backups');
    await fs.mkdir(backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-before-cleanup-${timestamp}.sql`);
    
    // Create a simple backup by exporting table structures and data
    const [tables] = await connection.execute(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ?",
      [DB_CONFIG.database]
    );
    
    let backupContent = `-- TSOAM Church Management System Database Backup\n`;
    backupContent += `-- Created: ${new Date().toISOString()}\n`;
    backupContent += `-- Before demo data cleanup\n\n`;
    
    for (const table of tables) {
      const tableName = table.table_name;
      
      // Get table structure
      const [createTable] = await connection.execute(`SHOW CREATE TABLE \`${tableName}\``);
      backupContent += `-- Table: ${tableName}\n`;
      backupContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      backupContent += createTable[0]['Create Table'] + ';\n\n';
      
      // Get table data
      const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``);
      if (rows.length > 0) {
        backupContent += `-- Data for table: ${tableName}\n`;
        backupContent += `INSERT INTO \`${tableName}\` VALUES\n`;
        
        const valueStrings = rows.map(row => {
          const values = Object.values(row).map(value => {
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            return value;
          });
          return `(${values.join(', ')})`;
        });
        
        backupContent += valueStrings.join(',\n') + ';\n\n';
      }
    }
    
    await fs.writeFile(backupFile, backupContent);
    log(`Backup created: ${backupFile}`);
    
    return backupFile;
  } catch (error) {
    log(`Backup failed: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * Get count of records that would be affected by cleanup
 */
async function getAffectedCounts(connection, module) {
  const counts = {};
  
  try {
    // Count appointments
    if (module === 'appointments' || !module) {
      const [result] = await connection.execute(
        "SELECT COUNT(*) as count FROM appointments WHERE title LIKE '%Demo%' OR title LIKE '%Sample%' OR title LIKE '%Test%' OR member_name LIKE '%Demo%'"
      );
      counts.appointments = result[0].count;
    }
    
    // Count members
    if (module === 'members' || !module) {
      const [result] = await connection.execute(
        "SELECT COUNT(*) as count FROM members WHERE first_name LIKE '%Demo%' OR last_name LIKE '%Sample%' OR email LIKE '%demo%' OR email LIKE '%test%'"
      );
      counts.members = result[0].count;
    }
    
    // Count financial transactions
    if (module === 'financial' || !module) {
      const [result] = await connection.execute(
        "SELECT COUNT(*) as count FROM financial_transactions WHERE description LIKE '%Demo%' OR description LIKE '%Sample%' OR description LIKE '%Test%'"
      );
      counts.financial = result[0].count;
    }
    
    // Add other module counts as needed...
    
  } catch (error) {
    log(`Failed to get affected counts: ${error.message}`, 'ERROR');
  }
  
  return counts;
}

/**
 * Execute cleanup queries for a specific module
 */
async function cleanupModule(connection, moduleName, moduleConfig) {
  try {
    log(`Starting cleanup for ${moduleConfig.name}...`);
    
    let affectedRows = 0;
    
    for (const query of moduleConfig.queries) {
      if (isDryRun) {
        log(`[DRY RUN] Would execute: ${query}`);
        continue;
      }
      
      try {
        const [result] = await connection.execute(query);
        
        // Track affected rows (for DELETE statements)
        if (query.trim().toUpperCase().startsWith('DELETE')) {
          affectedRows += result.affectedRows || 0;
          log(`Deleted ${result.affectedRows || 0} records`);
        } else if (query.trim().toUpperCase().startsWith('ALTER')) {
          log(`Reset auto-increment for table`);
        }
        
      } catch (queryError) {
        log(`Query failed: ${query}`, 'ERROR');
        log(`Error: ${queryError.message}`, 'ERROR');
        // Continue with next query
      }
    }
    
    log(`Completed cleanup for ${moduleConfig.name}. Affected rows: ${affectedRows}`);
    return affectedRows;
    
  } catch (error) {
    log(`Module cleanup failed for ${moduleName}: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * Main cleanup function
 */
async function performCleanup() {
  let connection;
  
  try {
    // Connect to database
    log('Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    log('Database connected successfully');
    
    // Get affected record counts
    const counts = await getAffectedCounts(connection, specificModule);
    
    // Show what will be cleaned
    console.log('\n🧹 Demo Data Cleanup Summary:');
    console.log('=' .repeat(50));
    
    if (specificModule && CLEANUP_QUERIES[specificModule]) {
      console.log(`Module: ${CLEANUP_QUERIES[specificModule].name}`);
      console.log(`Description: ${CLEANUP_QUERIES[specificModule].description}`);
      if (counts[specificModule] !== undefined) {
        console.log(`Records to be removed: ${counts[specificModule]}`);
      }
    } else {
      Object.entries(CLEANUP_QUERIES).forEach(([key, config]) => {
        console.log(`• ${config.name}: ${config.description}`);
        if (counts[key] !== undefined) {
          console.log(`  Records to be removed: ${counts[key]}`);
        }
      });
    }
    
    console.log('\n⚠️  WARNING: This action cannot be undone!');
    console.log('A backup will be created automatically.');
    
    if (isDryRun) {
      console.log('\n🔍 DRY RUN MODE: No actual changes will be made');
    }
    
    // Confirmation prompt
    if (!isForced && !isDryRun) {
      const confirm = await question('\nProceed with cleanup? (type "yes" to confirm): ');
      if (confirm.toLowerCase() !== 'yes') {
        log('Cleanup cancelled by user');
        return;
      }
    }
    
    // Create backup before cleanup
    if (!isDryRun) {
      await createBackup(connection);
    }
    
    // Disable foreign key checks during cleanup
    if (!isDryRun) {
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    }
    
    let totalAffected = 0;
    
    // Execute cleanup
    if (specificModule && CLEANUP_QUERIES[specificModule]) {
      // Clean specific module
      totalAffected = await cleanupModule(connection, specificModule, CLEANUP_QUERIES[specificModule]);
    } else {
      // Clean all modules
      for (const [moduleName, moduleConfig] of Object.entries(CLEANUP_QUERIES)) {
        totalAffected += await cleanupModule(connection, moduleName, moduleConfig);
      }
    }
    
    // Re-enable foreign key checks
    if (!isDryRun) {
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    }
    
    if (isDryRun) {
      log('DRY RUN completed. No changes were made.');
    } else {
      log(`✅ Cleanup completed successfully! Total records affected: ${totalAffected}`);
      log('Your system is now ready for production use.');
      
      console.log('\n🎉 Demo data cleanup completed!');
      console.log('💡 Next steps:');
      console.log('   1. Verify the cleanup worked as expected');
      console.log('   2. Change default admin password');
      console.log('   3. Configure system settings');
      console.log('   4. Import real data if needed');
    }
    
  } catch (error) {
    log(`Cleanup failed: ${error.message}`, 'ERROR');
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
    rl.close();
  }
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
TSOAM Church Management System - Demo Data Cleanup

Usage: node scripts/cleanup-demo-data.js [options]

Options:
  --module <name>   Clean specific module only
                    Available modules: ${Object.keys(CLEANUP_QUERIES).join(', ')}
  --dry-run        Show what would be cleaned without actually doing it
  --force          Skip confirmation prompt
  --help           Show this help message

Examples:
  node scripts/cleanup-demo-data.js                    # Clean all demo data
  node scripts/cleanup-demo-data.js --dry-run          # Preview cleanup
  node scripts/cleanup-demo-data.js --module members   # Clean only members
  node scripts/cleanup-demo-data.js --force            # Skip confirmation

⚠️  IMPORTANT: Always backup your database before running cleanup!
  `);
}

/**
 * Main entry point
 */
async function main() {
  if (args.includes('--help')) {
    showHelp();
    return;
  }
  
  console.log('🏛️  TSOAM Church Management System');
  console.log('🧹 Demo Data Cleanup Tool v2.0.0');
  console.log('');
  
  await performCleanup();
}

// Handle process termination
process.on('SIGINT', () => {
  log('Cleanup interrupted by user', 'WARN');
  rl.close();
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  performCleanup,
  CLEANUP_QUERIES,
  createBackup
};
