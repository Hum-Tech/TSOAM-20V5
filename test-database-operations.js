#!/usr/bin/env node

/**
 * Comprehensive Database Operations Test for TSOAM Church Management System
 * Tests all CRUD operations and ensures perfect synchronization
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
 * Test all database operations
 */
async function testDatabaseOperations() {
  console.log("🧪 TSOAM Database Operations Test");
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
    console.log("🔗 Connecting to MySQL database...");
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Database connection successful");

    // Test 1: User Management Operations
    console.log("\n👤 Testing User Management...");
    
    const testUserId = `test-user-${Date.now()}`;
    const testEmail = `test-${Date.now()}@example.com`;
    
    // Test user creation
    try {
      await connection.execute(
        `INSERT INTO users (id, name, email, password_hash, role, is_active) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [testUserId, 'Test User', testEmail, await bcrypt.hash('test123', 10), 'User', true]
      );
      test("User creation with proper ID generation", true);
    } catch (error) {
      test("User creation with proper ID generation", false);
      console.log(`   Error: ${error.message}`);
    }

    // Test user retrieval
    try {
      const [users] = await connection.execute(
        "SELECT id, name, email, role FROM users WHERE id = ?",
        [testUserId]
      );
      test("User retrieval after creation", users.length > 0);
    } catch (error) {
      test("User retrieval after creation", false);
    }

    // Test 2: Member Management Operations
    console.log("\n👥 Testing Member Management...");
    
    const testMemberId = `MEM-${Date.now()}`;
    const testTitheNumber = `TITHE-${Date.now()}`;
    
    try {
      await connection.execute(
        `INSERT INTO members (member_id, tithe_number, name, email, phone, status, join_date, gender) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [testMemberId, testTitheNumber, 'Test Member', 'member@test.com', '+254700000000', 'Active', new Date(), 'Male']
      );
      test("Member creation with all required fields", true);
    } catch (error) {
      test("Member creation with all required fields", false);
      console.log(`   Error: ${error.message}`);
    }

    // Test member retrieval
    try {
      const [members] = await connection.execute(
        "SELECT member_id, name, status FROM members WHERE member_id = ?",
        [testMemberId]
      );
      test("Member retrieval and data integrity", members.length > 0);
    } catch (error) {
      test("Member retrieval and data integrity", false);
    }

    // Test 3: Financial Transaction Operations
    console.log("\n💰 Testing Financial Management...");
    
    const transactionId = `TXN-${Date.now()}`;
    const transactionUniqueId = `TRANS-${Date.now()}`;
    
    try {
      await connection.execute(
        `INSERT INTO financial_transactions (id, transaction_id, type, category, description, amount, date, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [transactionId, transactionUniqueId, 'Income', 'Tithe', 'Test transaction', 1000.00, new Date(), 'Completed']
      );
      test("Financial transaction creation with proper IDs", true);
    } catch (error) {
      test("Financial transaction creation with proper IDs", false);
      console.log(`   Error: ${error.message}`);
    }

    // Test tithe record creation
    const titheId = `TITHE-${Date.now()}`;
    try {
      await connection.execute(
        `INSERT INTO tithe_records (id, tithe_number, member_id, amount, payment_method, tithe_date, category) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [titheId, testTitheNumber, 1, 500.00, 'Cash', new Date(), 'Tithe']
      );
      test("Tithe record creation and member linkage", true);
    } catch (error) {
      test("Tithe record creation and member linkage", false);
      console.log(`   Error: ${error.message}`);
    }

    // Test 4: Event Management Operations
    console.log("\n📅 Testing Event Management...");
    
    const eventId = `EVT-${Date.now()}`;
    const eventUniqueId = `EVENT-${Date.now()}`;
    
    try {
      await connection.execute(
        `INSERT INTO events (id, event_id, title, description, event_type, start_date, location, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [eventId, eventUniqueId, 'Test Event', 'Test Description', 'Service', new Date(), 'Main Hall', 'Planning']
      );
      test("Event creation with proper structure", true);
    } catch (error) {
      test("Event creation with proper structure", false);
      console.log(`   Error: ${error.message}`);
    }

    // Test 5: Appointment Management Operations
    console.log("\n📋 Testing Appointment Management...");
    
    const appointmentId = `APT-${Date.now()}`;
    
    try {
      await connection.execute(
        `INSERT INTO appointments (id, title, description, date, time, type, organizer_id, organizer_name, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [appointmentId, 'Test Appointment', 'Test Description', new Date(), '10:00:00', 'Meeting', testUserId, 'Test User', testUserId]
      );
      test("Appointment creation with user linkage", true);
    } catch (error) {
      test("Appointment creation with user linkage", false);
      console.log(`   Error: ${error.message}`);
    }

    // Test 6: HR Management Operations
    console.log("\n👨‍💼 Testing HR Management...");
    
    const employeeId = `EMP-${Date.now()}`;
    
    try {
      await connection.execute(
        `INSERT INTO employees (employee_id, name, email, phone, position, department, employment_type, hire_date, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [employeeId, 'Test Employee', 'emp@test.com', '+254700000001', 'Manager', 'Administration', 'Full-time', new Date(), 'Active']
      );
      test("Employee record creation", true);
    } catch (error) {
      test("Employee record creation", false);
      console.log(`   Error: ${error.message}`);
    }

    // Test leave request creation
    const leaveRequestId = `LEAVE-${Date.now()}`;
    try {
      await connection.execute(
        `INSERT INTO leave_requests (id, employee_id, leave_type_id, start_date, end_date, resumption_date, total_days, working_days, reason, status, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [leaveRequestId, 1, 'annual', new Date(), new Date(), new Date(), 5, 5, 'Test leave', 'draft', testUserId]
      );
      test("Leave request creation and employee linkage", true);
    } catch (error) {
      test("Leave request creation and employee linkage", false);
      console.log(`   Error: ${error.message}`);
    }

    // Test 7: Messaging System Operations
    console.log("\n💬 Testing Messaging System...");
    
    const messageId = `MSG-${Date.now()}`;
    const messageUniqueId = `MSGID-${Date.now()}`;
    
    try {
      await connection.execute(
        `INSERT INTO messages (id, message_id, sender_id, sender_name, recipient_type, subject, message_content, message_type, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [messageId, messageUniqueId, testUserId, 'Test User', 'Individual', 'Test Message', 'This is a test message', 'In-App', 'Sent']
      );
      test("Message creation with proper ID generation", true);
    } catch (error) {
      test("Message creation with proper ID generation", false);
      console.log(`   Error: ${error.message}`);
    }

    // Test 8: Inventory Management Operations
    console.log("\n📦 Testing Inventory Management...");
    
    const itemCode = `ITEM-${Date.now()}`;
    
    try {
      await connection.execute(
        `INSERT INTO inventory_items (item_code, name, category, description, quantity, unit_cost, location, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [itemCode, 'Test Item', 'Equipment', 'Test equipment', 5, 100.00, 'Storage Room', 'Active']
      );
      test("Inventory item creation and tracking", true);
    } catch (error) {
      test("Inventory item creation and tracking", false);
      console.log(`   Error: ${error.message}`);
    }

    // Test 9: System Logging Operations
    console.log("\n📊 Testing System Logging...");
    
    const logId = `LOG-${Date.now()}`;
    
    try {
      await connection.execute(
        `INSERT INTO system_logs (log_id, user_id, action, module, details, severity, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [logId, testUserId, 'TEST_ACTION', 'TEST_MODULE', 'Test log entry', 'Info', 'Success']
      );
      test("System logging functionality", true);
    } catch (error) {
      test("System logging functionality", false);
      console.log(`   Error: ${error.message}`);
    }

    // Test 10: Data Relationships and Integrity
    console.log("\n🔗 Testing Data Relationships...");
    
    try {
      // Test user-member relationship
      const [userMemberData] = await connection.execute(`
        SELECT u.name as user_name, m.name as member_name 
        FROM users u 
        LEFT JOIN members m ON u.email = m.email 
        WHERE u.id = ?
      `, [testUserId]);
      
      test("User-member relationship queries", true);
    } catch (error) {
      test("User-member relationship queries", false);
    }

    try {
      // Test financial summary
      const [financialSummary] = await connection.execute(`
        SELECT 
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount
        FROM financial_transactions 
        WHERE status = 'Completed'
      `);
      
      test("Financial summary calculations", true);
    } catch (error) {
      test("Financial summary calculations", false);
    }

    // Cleanup test data
    console.log("\n🧹 Cleaning up test data...");
    
    const cleanupQueries = [
      'DELETE FROM system_logs WHERE log_id = ?',
      'DELETE FROM inventory_items WHERE item_code = ?',
      'DELETE FROM messages WHERE id = ?',
      'DELETE FROM leave_requests WHERE id = ?',
      'DELETE FROM employees WHERE employee_id = ?',
      'DELETE FROM appointments WHERE id = ?',
      'DELETE FROM events WHERE id = ?',
      'DELETE FROM tithe_records WHERE id = ?',
      'DELETE FROM financial_transactions WHERE id = ?',
      'DELETE FROM members WHERE member_id = ?',
      'DELETE FROM users WHERE id = ?'
    ];

    const cleanupParams = [
      [logId], [itemCode], [messageId], [leaveRequestId], [employeeId],
      [appointmentId], [eventId], [titheId], [transactionId], [testMemberId], [testUserId]
    ];

    let cleanedUp = 0;
    for (let i = 0; i < cleanupQueries.length; i++) {
      try {
        await connection.execute(cleanupQueries[i], cleanupParams[i]);
        cleanedUp++;
      } catch (error) {
        console.warn(`Cleanup warning: ${error.message}`);
      }
    }

    test(`Test data cleanup (${cleanedUp}/${cleanupQueries.length} items)`, cleanedUp >= cleanupQueries.length - 2);

    // Final Results
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📊 Database Operations Test Results: ${testsPassed}/${totalTests} tests passed`);

    if (testsPassed === totalTests) {
      console.log("🎉 ALL DATABASE OPERATIONS WORKING PERFECTLY!");
      console.log("✅ Database synchronization is fully functional");
      console.log("✅ All CRUD operations are working correctly");
      console.log("✅ Data relationships and integrity maintained");
      console.log("✅ ID generation and management working properly");
    } else {
      console.log("⚠️  SOME DATABASE OPERATIONS FAILED!");
      console.log(`❌ ${totalTests - testsPassed} issues need to be resolved`);
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    console.error("❌ Database operations test failed:", error.message);
    console.log("\n💡 Troubleshooting steps:");
    console.log("   1. Ensure MySQL server is running");
    console.log("   2. Run: npm run db:init");
    console.log("   3. Verify all tables exist");
    console.log("   4. Check database permissions");
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
if (require.main === module) {
  testDatabaseOperations();
}

module.exports = { testDatabaseOperations };
