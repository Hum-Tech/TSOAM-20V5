#!/usr/bin/env node

/**
 * Apply Essential Database Schema for TSOAM Church Management System
 * Simple and reliable schema application
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

async function applyEssentialSchema() {
  let connection;
  
  try {
    console.log('🚀 TSOAM Essential Database Schema Setup');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Read the essential schema file
    const schemaPath = path.join(__dirname, '../database/essential-schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Essential schema file not found: ' + schemaPath);
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Essential schema file loaded successfully');
    
    // Connect to MySQL without selecting database first
    console.log('🔗 Connecting to MySQL server...');
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true
    });
    console.log('✅ Connected to MySQL server');
    
    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbConfig.database}' created/verified`);
    
    // Use the database
    await connection.execute(`USE ${dbConfig.database}`);
    console.log(`📍 Using database: ${dbConfig.database}`);
    
    // Execute the entire schema as one statement
    try {
      await connection.query(schemaSQL);
      console.log('✅ Schema executed successfully');
    } catch (error) {
      // If bulk execution fails, try statement by statement
      console.log('⚠️  Bulk execution failed, trying individual statements...');
      
      const statements = schemaSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => 
          stmt.length > 0 && 
          !stmt.startsWith('--') && 
          !stmt.startsWith('#') &&
          !stmt.toUpperCase().startsWith('CREATE DATABASE') &&
          !stmt.toUpperCase().startsWith('USE ') &&
          !stmt.toUpperCase().startsWith('SELECT \'✅')
        );
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const statement of statements) {
        try {
          await connection.execute(statement);
          successCount++;
          
          if (statement.includes('CREATE TABLE')) {
            const tableName = statement.match(/CREATE TABLE.*?`?(\w+)`?/i)?.[1] || 'unknown';
            console.log(`   ✅ Created table: ${tableName}`);
          } else if (statement.includes('INSERT IGNORE INTO')) {
            const tableName = statement.match(/INSERT IGNORE INTO.*?`?(\w+)`?/i)?.[1] || 'unknown';
            console.log(`   ✅ Inserted data into: ${tableName}`);
          }
        } catch (stmtError) {
          if (stmtError.code !== 'ER_TABLE_EXISTS_ERROR' && 
              stmtError.code !== 'ER_DUP_ENTRY' &&
              stmtError.code !== 'ER_DUP_KEYNAME') {
            errorCount++;
            console.log(`   ❌ Error: ${stmtError.message}`);
          }
        }
      }
      
      console.log(`📊 Individual execution: ${successCount} successful, ${errorCount} errors`);
    }
    
    // Verify the setup
    console.log('\n🔍 Verifying database setup...');
    
    // Count tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`   📊 Total tables: ${tables.length}`);
    
    // Check admin user
    const [adminUsers] = await connection.execute(
      "SELECT name, email, role FROM users WHERE email = 'admin@tsoam.org'"
    );
    console.log(`   👤 Admin user exists: ${adminUsers.length > 0 ? '✅' : '❌'}`);
    
    // Check default settings
    const [settings] = await connection.execute('SELECT COUNT(*) as count FROM system_settings');
    console.log(`   ⚙️  System settings: ${settings[0].count} entries`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Essential database schema applied successfully!');
    console.log('\n🔐 Default Login Credentials:');
    console.log('   Email: admin@tsoam.org');
    console.log('   Password: admin123');
    console.log('\n📋 Next Steps:');
    console.log('   1. Test login at http://localhost:3002');
    console.log('   2. Visit setup page: http://localhost:3002/setup');
    console.log('   3. Change default passwords');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('❌ Schema application failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Ensure MySQL server is running');
    console.log('   2. Check database credentials in .env');
    console.log('   3. Verify MySQL user has CREATE/ALTER privileges');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the schema application
if (require.main === module) {
  applyEssentialSchema();
}

module.exports = { applyEssentialSchema };
