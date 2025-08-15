#!/usr/bin/env node

/**
 * Fix Admin User Script - TSOAM Church Management System
 * Checks if admin user exists and creates it if missing
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tsoam_church_db'
};

async function fixAdminUser() {
  let connection;
  
  try {
    console.log("🔍 Checking admin user in database...");
    
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to database");

    // Check if admin user exists
    const [existingUsers] = await connection.execute(
      'SELECT id, email, role, is_active FROM users WHERE email = ?',
      ['admin@tsoam.org']
    );

    if (existingUsers.length > 0) {
      console.log("✅ Admin user already exists:");
      console.log("   Email:", existingUsers[0].email);
      console.log("   Role:", existingUsers[0].role);
      console.log("   Active:", existingUsers[0].is_active ? 'Yes' : 'No');
      
      // Check if user is active
      if (!existingUsers[0].is_active) {
        await connection.execute(
          'UPDATE users SET is_active = TRUE WHERE email = ?',
          ['admin@tsoam.org']
        );
        console.log("✅ Admin user activated");
      }
    } else {
      console.log("❌ Admin user not found. Creating...");
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUserId = 'admin-001';
      
      await connection.execute(`
        INSERT INTO users (id, name, email, password_hash, role, is_active, can_create_accounts, can_delete_accounts, department, employee_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        adminUserId,
        'System Administrator',
        'admin@tsoam.org',
        hashedPassword,
        'Admin',
        true,
        true,
        true,
        'Administration',
        'TSOAM-ADM-001'
      ]);
      
      console.log("✅ Admin user created successfully");
    }

    // Test login credentials
    console.log("\n🔐 Testing login credentials...");
    const [users] = await connection.execute(
      'SELECT password_hash FROM users WHERE email = ? AND is_active = true',
      ['admin@tsoam.org']
    );

    if (users.length > 0) {
      const isValidPassword = await bcrypt.compare('admin123', users[0].password_hash);
      console.log("   Password verification:", isValidPassword ? '✅ Valid' : '❌ Invalid');
      
      if (!isValidPassword) {
        console.log("🔧 Updating password...");
        const newHashedPassword = await bcrypt.hash('admin123', 10);
        await connection.execute(
          'UPDATE users SET password_hash = ? WHERE email = ?',
          [newHashedPassword, 'admin@tsoam.org']
        );
        console.log("✅ Password updated");
      }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Admin user setup completed!");
    console.log("🔐 Login credentials:");
    console.log("   Email: admin@tsoam.org");
    console.log("   Password: admin123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    console.error("❌ Error fixing admin user:", error.message);
    console.log("\n💡 Troubleshooting:");
    console.log("   1. Ensure MySQL is running");
    console.log("   2. Check database credentials in .env");
    console.log("   3. Verify database exists");
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the fix
if (require.main === module) {
  fixAdminUser();
}

module.exports = { fixAdminUser };
