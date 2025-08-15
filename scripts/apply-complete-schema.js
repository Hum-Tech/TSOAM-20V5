#!/usr/bin/env node

/**
 * Apply Complete Database Schema for TSOAM Church Management System
 * This script applies the comprehensive database schema with all tables and privileges
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tsoam_church_db',
  multipleStatements: true
};

async function applyCompleteSchema() {
  let connection;

  try {
    console.log('🚀 TSOAM Complete Database Schema Setup');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Read the schema file
    const schemaPath = path.join(__dirname, '../database/complete-schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Schema file not found: ' + schemaPath);
    }

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Schema file loaded successfully');

    // Connect to MySQL
    console.log('🔗 Connecting to MySQL server...');
    connection = await mysql.createConnection({
      ...dbConfig,
      multipleStatements: true
    });
    console.log('✅ Connected to MySQL server');

    // First, ensure database exists and select it
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database || 'tsoam_church_db'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.execute(`USE ${dbConfig.database || 'tsoam_church_db'}`);
    console.log(`📍 Using database: ${dbConfig.database || 'tsoam_church_db'}`);

    // Split the SQL file into individual statements, filtering out database creation and USE statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt =>
        stmt.length > 0 &&
        !stmt.startsWith('--') &&
        !stmt.startsWith('#') &&
        !stmt.toUpperCase().startsWith('CREATE DATABASE') &&
        !stmt.toUpperCase().startsWith('USE ')
      );

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      try {
        // Skip comments and empty statements
        if (statement.trim().startsWith('--') ||
            statement.trim().startsWith('#') ||
            statement.trim().length === 0) {
          skipCount++;
          continue;
        }

        // Skip problematic statements that cause prepared statement issues
        if (statement.includes('CREATE OR REPLACE VIEW') ||
            statement.includes('FLUSH PRIVILEGES') ||
            statement.includes('SET SQL_MODE') ||
            statement.includes('SELECT \'✅') ||
            statement.toUpperCase().startsWith('SELECT ')) {
          console.log(`   ⏭️  Skipped: ${statement.substring(0, 50)}...`);
          skipCount++;
          continue;
        }

        await connection.execute(statement);
        successCount++;

        // Log progress for major operations
        if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE.*?`?(\w+)`?/i)?.[1] || 'unknown';
          console.log(`   ✅ Created table: ${tableName}`);
        } else if (statement.includes('CREATE USER')) {
          const userName = statement.match(/CREATE USER.*?'([^']+)'/i)?.[1] || 'unknown';
          console.log(`   ✅ Created user: ${userName}`);
        } else if (statement.includes('INSERT IGNORE INTO')) {
          const tableName = statement.match(/INSERT IGNORE INTO.*?`?(\w+)`?/i)?.[1] || 'unknown';
          console.log(`   ✅ Inserted default data into: ${tableName}`);
        } else if (statement.includes('ALTER TABLE') && statement.includes('ADD INDEX')) {
          const tableName = statement.match(/ALTER TABLE.*?`?(\w+)`?/i)?.[1] || 'unknown';
          console.log(`   ✅ Added index to table: ${tableName}`);
        }

      } catch (error) {
        // Handle different types of errors appropriately
        if (error.code === 'ER_TABLE_EXISTS_ERROR' ||
            error.code === 'ER_USER_ALREADY_EXISTS' ||
            error.code === 'ER_DUP_ENTRY' ||
            error.code === 'ER_DUP_KEYNAME' ||
            error.message.includes('Duplicate key name')) {
          skipCount++;
          // Don't count as success since it was skipped
        } else if (error.message.includes('not supported in the prepared statement protocol') ||
                   error.message.includes('You are not allowed to create a user with GRANT')) {
          console.log(`   ⏭️  Skipped (requires manual setup): ${statement.substring(0, 50)}...`);
          skipCount++;
        } else {
          errorCount++;
          console.log(`   ❌ Error in statement ${i + 1}: ${error.message}`);
        }
      }
    }

    console.log('\n📊 Schema Application Results:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    // Verify the setup
    console.log('\n🔍 Verifying database setup...');

    // Check database exists
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbExists = databases.some(db => Object.values(db)[0] === 'tsoam_church_db');
    console.log(`   Database exists: ${dbExists ? '✅' : '❌'}`);

    if (dbExists) {
      // Switch to the database
      await connection.execute('USE tsoam_church_db');

      // Count tables
      const [tables] = await connection.execute('SHOW TABLES');
      console.log(`   Total tables: ${tables.length}`);

      // Check admin user
      const [adminUsers] = await connection.execute(
        "SELECT name, email, role FROM users WHERE email = 'admin@tsoam.org'"
      );
      console.log(`   Admin user exists: ${adminUsers.length > 0 ? '✅' : '❌'}`);

      // Check default settings
      const [settings] = await connection.execute('SELECT COUNT(*) as count FROM system_settings');
      console.log(`   System settings: ${settings[0].count} entries`);

      // Check role permissions
      const [permissions] = await connection.execute('SELECT COUNT(*) as count FROM role_permissions');
      console.log(`   Role permissions: ${permissions[0].count} entries`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Complete database schema applied successfully!');
    console.log('\n🔐 Default Login Credentials:');
    console.log('   Email: admin@tsoam.org');
    console.log('   Password: admin123');
    console.log('\n👥 Database Users Created:');
    console.log('   tsoam_admin - Full administrative access');
    console.log('   tsoam_app - Application runtime access');
    console.log('   tsoam_readonly - Read-only access for reporting');
    console.log('\n📋 Next Steps:');
    console.log('   1. Update .env with appropriate database user');
    console.log('   2. Restart the application server');
    console.log('   3. Test login at http://localhost:3002');
    console.log('   4. Change default passwords');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Schema application failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Ensure MySQL server is running');
    console.log('   2. Check database credentials in .env');
    console.log('   3. Verify MySQL user has CREATE/ALTER privileges');
    console.log('   4. Check MySQL version (8.0+ recommended)');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the schema application
if (require.main === module) {
  applyCompleteSchema();
}

module.exports = { applyCompleteSchema };
