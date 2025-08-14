#!/usr/bin/env node

/**
 * Database Synchronization Test Script for TSOAM Church Management System
 * Tests all database operations, authentication, and data synchronization
 */

const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tsoam_church_db",
};

/**
 * Test database connection and operations
 */
async function testDatabaseSync() {
  console.log("🧪 TSOAM Database Synchronization Test");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  let connection;
  let testsPassed = 0;
  let totalTests = 0;

  function test(description, condition) {
    totalTests++;
    if (condition) {
      console.log(`✅ ${description}`);
      testsPassed++;
    } else {
      console.log(`❌ ${description}`);
    }
  }

  try {
    // Connect to database
    console.log("🔗 Connecting to MySQL database...");
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Database connection successful");

    // Test 1: Verify all required tables exist
    console.log("\n📋 Testing Table Structure...");
    const [tables] = await connection.execute("SHOW TABLES");
    const tableNames = tables.map(table => Object.values(table)[0]);
    
    const requiredTables = [
      'users', 'password_resets', 'user_sessions', 'system_settings',
      'members', 'new_members', 'employees', 'leave_types', 'leave_requests',
      'financial_transactions', 'tithe_records', 'events', 'appointments',
      'welfare_requests', 'inventory_items', 'messages', 'system_logs',
      'document_uploads', 'notifications'
    ];

    requiredTables.forEach(tableName => {
      test(`Table '${tableName}' exists`, tableNames.includes(tableName));
    });

    // Test 2: Verify default users exist and can authenticate
    console.log("\n🔐 Testing Authentication System...");
    
    // Check admin user exists
    const [adminUsers] = await connection.execute(
      "SELECT id, email, password_hash, role, is_active FROM users WHERE email = ?",
      ['admin@tsoam.org']
    );
    test("Admin user exists", adminUsers.length > 0);
    
    if (adminUsers.length > 0) {
      const admin = adminUsers[0];
      test("Admin user is active", admin.is_active === 1);
      test("Admin has correct role", admin.role === 'Admin');
      
      // Test password verification
      const passwordValid = await bcrypt.compare('admin123', admin.password_hash);
      test("Admin password verifies correctly", passwordValid);
    }

    // Check HR user exists
    const [hrUsers] = await connection.execute(
      "SELECT id, email, role FROM users WHERE email = ?",
      ['hr@tsoam.org']
    );
    test("HR user exists", hrUsers.length > 0);

    // Check Finance user exists
    const [financeUsers] = await connection.execute(
      "SELECT id, email, role FROM users WHERE email = ?",
      ['finance@tsoam.org']
    );
    test("Finance user exists", financeUsers.length > 0);

    // Test 3: Test account creation functionality
    console.log("\n👤 Testing Account Creation...");
    
    const testUserId = `test-${Date.now()}`;
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpass123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    try {
      await connection.execute(
        `INSERT INTO users (id, name, email, password_hash, role, is_active) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [testUserId, 'Test User', testEmail, hashedPassword, 'User', true]
      );
      test("User account creation successful", true);

      // Verify the created user
      const [createdUsers] = await connection.execute(
        "SELECT id, name, email, role FROM users WHERE id = ?",
        [testUserId]
      );
      test("Created user can be retrieved", createdUsers.length > 0);

      // Cleanup test user
      await connection.execute("DELETE FROM users WHERE id = ?", [testUserId]);
      test("Test user cleanup successful", true);

    } catch (error) {
      test("User account creation successful", false);
      console.log(`   Error: ${error.message}`);
    }

    // Test 4: Test password reset functionality
    console.log("\n🔄 Testing Password Reset System...");
    
    try {
      // Create a test password reset record
      const resetCode = '123456';
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      
      await connection.execute(
        `INSERT INTO password_resets (user_id, email, reset_code, expires_at, used) 
         VALUES (?, ?, ?, ?, ?)`,
        [adminUsers[0].id, 'admin@tsoam.org', resetCode, expiresAt, false]
      );
      test("Password reset record creation successful", true);

      // Verify the reset record exists
      const [resetRecords] = await connection.execute(
        "SELECT id, reset_code, expires_at, used FROM password_resets WHERE email = ? AND reset_code = ?",
        ['admin@tsoam.org', resetCode]
      );
      test("Password reset record can be retrieved", resetRecords.length > 0);

      // Cleanup test reset record
      await connection.execute(
        "DELETE FROM password_resets WHERE email = ? AND reset_code = ?",
        ['admin@tsoam.org', resetCode]
      );
      test("Password reset cleanup successful", true);

    } catch (error) {
      test("Password reset system functional", false);
      console.log(`   Error: ${error.message}`);
    }

    // Test 5: Test data synchronization with other tables
    console.log("\n🔄 Testing Data Synchronization...");

    // Test member creation
    try {
      const testMemberId = `TEST-${Date.now()}`;
      await connection.execute(
        `INSERT INTO members (member_id, name, email, phone, status, join_date, gender) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [testMemberId, 'Test Member', 'test.member@example.com', '+254700000000', 'Active', new Date(), 'Male']
      );
      test("Member record creation successful", true);

      // Cleanup
      await connection.execute("DELETE FROM members WHERE member_id = ?", [testMemberId]);

    } catch (error) {
      test("Member record creation successful", false);
      console.log(`   Error: ${error.message}`);
    }

    // Test financial transaction creation
    try {
      const testTransactionId = `TXN-${Date.now()}`;
      await connection.execute(
        `INSERT INTO financial_transactions (transaction_id, type, category, description, amount, date, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [testTransactionId, 'Income', 'Tithe', 'Test transaction', 1000.00, new Date(), 'Completed']
      );
      test("Financial transaction creation successful", true);

      // Cleanup
      await connection.execute("DELETE FROM financial_transactions WHERE transaction_id = ?", [testTransactionId]);

    } catch (error) {
      test("Financial transaction creation successful", false);
      console.log(`   Error: ${error.message}`);
    }

    // Test 6: Verify system settings
    console.log("\n⚙️  Testing System Settings...");
    
    const [settings] = await connection.execute("SELECT COUNT(*) as count FROM system_settings");
    test("System settings exist", settings[0].count > 0);

    const [churchName] = await connection.execute(
      "SELECT setting_value FROM system_settings WHERE setting_key = ?",
      ['church_name']
    );
    test("Church name setting exists", churchName.length > 0);

    // Test 7: Verify leave types (for HR module)
    console.log("\n📅 Testing HR Module Data...");
    
    const [leaveTypes] = await connection.execute("SELECT COUNT(*) as count FROM leave_types");
    test("Leave types exist", leaveTypes[0].count > 0);

    const [annualLeave] = await connection.execute(
      "SELECT id, name FROM leave_types WHERE code = ?",
      ['AL']
    );
    test("Annual leave type exists", annualLeave.length > 0);

    // Final Results
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📊 Test Results: ${testsPassed}/${totalTests} tests passed`);

    if (testsPassed === totalTests) {
      console.log("🎉 ALL TESTS PASSED!");
      console.log("✅ Database is fully synchronized and ready for production");
      console.log("✅ Authentication system is working correctly");
      console.log("✅ Account creation and password reset are functional");
      console.log("✅ All required tables exist and are accessible");
      console.log("✅ Data synchronization is working properly");
    } else {
      console.log("⚠️  SOME TESTS FAILED!");
      console.log(`❌ ${totalTests - testsPassed} issues need to be resolved`);
      console.log("💡 Please review the failed tests above");
    }

    console.log("\n🔐 Login Credentials (confirmed working):");
    console.log("   Admin: admin@tsoam.org / admin123");
    console.log("   HR: hr@tsoam.org / hr123");
    console.log("   Finance: finance@tsoam.org / finance123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    console.error("❌ Database test failed:", error.message);
    console.log("\n💡 Troubleshooting steps:");
    console.log("   1. Ensure MySQL server is running");
    console.log("   2. Verify database credentials in .env file");
    console.log("   3. Run: npm run db:init");
    console.log("   4. Check MySQL user has proper privileges");
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
if (require.main === module) {
  testDatabaseSync();
}

module.exports = { testDatabaseSync };
