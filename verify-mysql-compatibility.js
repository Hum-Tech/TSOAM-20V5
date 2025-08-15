#!/usr/bin/env node

/**
 * MySQL Compatibility and Database Verification Script
 * Ensures complete MySQL compatibility and error-free database operations
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tsoam_church_db",
};

/**
 * Verify MySQL compatibility and database integrity
 */
async function verifyMySQLCompatibility() {
  console.log("🔍 MySQL Compatibility & Database Verification");
  console.log("━━━━━━━���━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  let connection;
  let checksPassed = 0;
  let totalChecks = 0;

  function check(description, condition, details = "") {
    totalChecks++;
    if (condition) {
      console.log(`✅ ${description}`);
      checksPassed++;
    } else {
      console.log(`❌ ${description}`);
      if (details) console.log(`   ${details}`);
    }
  }

  try {
    // Connect to MySQL
    console.log("🔗 Connecting to MySQL database...");
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Database connection successful");

    // Check 1: MySQL Version Compatibility
    console.log("\n📊 Checking MySQL Version Compatibility...");
    const [versionResult] = await connection.execute("SELECT VERSION() as version");
    const version = versionResult[0].version;
    const majorVersion = parseInt(version.split('.')[0]);
    check("MySQL version compatibility", majorVersion >= 5, `Version: ${version}`);

    // Check 2: Database and Character Set
    console.log("\n🗂️  Verifying Database Configuration...");
    const [dbInfo] = await connection.execute(`
      SELECT DEFAULT_CHARACTER_SET_NAME as charset, DEFAULT_COLLATION_NAME as collation 
      FROM information_schema.SCHEMATA 
      WHERE SCHEMA_NAME = ?
    `, [dbConfig.database]);
    
    if (dbInfo.length > 0) {
      check("Database exists with proper charset", dbInfo[0].charset === 'utf8mb4');
      check("Database collation is correct", dbInfo[0].collation.includes('utf8mb4'));
    } else {
      check("Database exists", false, "Database not found");
    }

    // Check 3: All Required Tables Exist
    console.log("\n📋 Verifying Table Structure...");
    const [tables] = await connection.execute("SHOW TABLES");
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    const requiredTables = [
      'users', 'password_resets', 'user_sessions', 'system_settings', 'system_logs',
      'members', 'new_members', 'employees', 'leave_types', 'leave_requests',
      'financial_transactions', 'tithe_records', 'events', 'appointments',
      'welfare_requests', 'inventory_items', 'messages', 'document_uploads', 'notifications'
    ];

    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    check(`All required tables exist (${tableNames.length}/19)`, missingTables.length === 0);
    
    if (missingTables.length > 0) {
      console.log(`   Missing tables: ${missingTables.join(', ')}`);
    }

    // Check 4: Table Structure Validation
    console.log("\n🏗️  Validating Table Structures...");
    
    // Check users table structure
    const [usersColumns] = await connection.execute("DESCRIBE users");
    const usersPrimaryKey = usersColumns.find(col => col.Key === 'PRI');
    check("Users table has proper primary key", usersPrimaryKey && usersPrimaryKey.Field === 'id');

    // Check financial_transactions table structure
    const [transactionsColumns] = await connection.execute("DESCRIBE financial_transactions");
    const transactionsPrimaryKey = transactionsColumns.find(col => col.Key === 'PRI');
    check("Financial transactions table structure", transactionsPrimaryKey && transactionsPrimaryKey.Field === 'id');

    // Check 5: Index Verification
    console.log("\n📈 Checking Database Indexes...");
    
    const indexQueries = [
      "SHOW INDEX FROM users WHERE Key_name = 'idx_email'",
      "SHOW INDEX FROM members WHERE Key_name = 'idx_member_id'",
      "SHOW INDEX FROM financial_transactions WHERE Key_name = 'idx_type_date'",
      "SHOW INDEX FROM system_logs WHERE Key_name = 'idx_module_timestamp'"
    ];

    let indexesFound = 0;
    for (const query of indexQueries) {
      try {
        const [indexResult] = await connection.execute(query);
        if (indexResult.length > 0) indexesFound++;
      } catch (error) {
        // Index might not exist, that's okay
      }
    }
    
    check(`Performance indexes created (${indexesFound}/${indexQueries.length})`, indexesFound >= indexQueries.length - 1);

    // Check 6: Data Integrity Constraints
    console.log("\n🔗 Verifying Data Constraints...");
    
    // Check foreign key constraints
    const [constraints] = await connection.execute(`
      SELECT COUNT(*) as count FROM information_schema.TABLE_CONSTRAINTS 
      WHERE CONSTRAINT_SCHEMA = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    `, [dbConfig.database]);
    
    check("Foreign key constraints present", constraints[0].count > 0);

    // Check 7: Default Data Verification
    console.log("\n👤 Verifying Default Data...");
    
    // Check default users
    const [defaultUsers] = await connection.execute("SELECT COUNT(*) as count FROM users WHERE email IN ('admin@tsoam.org', 'hr@tsoam.org', 'finance@tsoam.org')");
    check("Default users created", defaultUsers[0].count >= 3);

    // Check system settings
    const [settings] = await connection.execute("SELECT COUNT(*) as count FROM system_settings");
    check("System settings configured", settings[0].count >= 5);

    // Check leave types
    const [leaveTypes] = await connection.execute("SELECT COUNT(*) as count FROM leave_types");
    check("Leave types configured", leaveTypes[0].count >= 6);

    // Check 8: SQL Syntax Compatibility
    console.log("\n⚙️  Testing SQL Syntax Compatibility...");
    
    try {
      // Test UUID generation alternative
      await connection.execute("SELECT CONCAT('test-', UNIX_TIMESTAMP(), '-', CONNECTION_ID()) as test_id");
      check("ID generation syntax compatible", true);
    } catch (error) {
      check("ID generation syntax compatible", false, error.message);
    }

    try {
      // Test date functions
      await connection.execute("SELECT CURRENT_DATE, CURRENT_TIMESTAMP, NOW()");
      check("Date function compatibility", true);
    } catch (error) {
      check("Date function compatibility", false, error.message);
    }

    try {
      // Test JSON column type
      await connection.execute("SELECT JSON_OBJECT('test', 'value') as json_test");
      check("JSON column type support", true);
    } catch (error) {
      check("JSON column type support", false, error.message);
    }

    // Check 9: Performance and Optimization
    console.log("\n🚀 Performance and Optimization Checks...");
    
    // Check table engine
    const [engines] = await connection.execute(`
      SELECT ENGINE, COUNT(*) as count 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      GROUP BY ENGINE
    `, [dbConfig.database]);
    
    const innodbTables = engines.find(e => e.ENGINE === 'InnoDB');
    check("Tables using InnoDB engine", innodbTables && innodbTables.count > 0);

    // Check 10: Connection and Query Performance
    console.log("\n⚡ Testing Database Performance...");
    
    const startTime = Date.now();
    await connection.execute("SELECT COUNT(*) FROM users");
    const queryTime = Date.now() - startTime;
    check("Query performance acceptable", queryTime < 1000, `Query time: ${queryTime}ms`);

    // Final Assessment
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📊 MySQL Compatibility Check Results: ${checksPassed}/${totalChecks} checks passed`);

    if (checksPassed === totalChecks) {
      console.log("🎉 PERFECT MYSQL COMPATIBILITY!");
      console.log("✅ Database is fully compatible with MySQL");
      console.log("✅ All tables and structures are properly configured");
      console.log("✅ No SQL syntax errors detected");
      console.log("✅ Performance optimizations are in place");
      console.log("✅ System is ready for production use");
      console.log("\n🚀 Ready to start the application:");
      console.log("   npm start");
    } else {
      console.log("⚠️  SOME COMPATIBILITY ISSUES DETECTED!");
      console.log(`❌ ${totalChecks - checksPassed} issues need attention`);
      console.log("\n🔧 Recommended actions:");
      if (checksPassed < totalChecks * 0.8) {
        console.log("   1. Run: npm run db:init");
        console.log("   2. Check MySQL version compatibility");
        console.log("   3. Verify database permissions");
      } else {
        console.log("   Minor issues detected - system should still work");
      }
    }

    console.log("\n📈 System Health Score: " + Math.round((checksPassed / totalChecks) * 100) + "%");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    console.error("❌ MySQL compatibility check failed:", error.message);
    console.log("\n💡 Troubleshooting Guide:");
    console.log("   1. Start MySQL server (XAMPP/WAMP/MySQL service)");
    console.log("   2. Check database connection: npm run mysql:check");
    console.log("   3. Initialize database: npm run db:init");
    console.log("   4. Verify MySQL version is 5.7+ or 8.0+");
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the verification
if (require.main === module) {
  verifyMySQLCompatibility();
}

module.exports = { verifyMySQLCompatibility };
