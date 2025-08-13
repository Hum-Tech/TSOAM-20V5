#!/usr/bin/env node

/**
 * Fix Admin User Script for TSOAM Church Management System
 * Ensures the admin user exists in the database with correct credentials
 */

const { query } = require("./server/config/database");
const bcrypt = require("bcryptjs");

async function fixAdminUser() {
  console.log("🔧 Fixing admin user in database...");

  try {
    // Check if admin user exists
    const existingUserResult = await query(
      "SELECT id, name, email, role FROM users WHERE email = ?",
      ["admin@tsoam.org"]
    );

    if (existingUserResult.success && existingUserResult.data.length > 0) {
      console.log("✅ Admin user already exists:", existingUserResult.data[0]);

      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash("admin123", 12);

      const updateResult = await query(
        "UPDATE users SET password_hash = ?, is_active = ? WHERE email = ?",
        [hashedPassword, true, "admin@tsoam.org"]
      );

      if (updateResult.success) {
        console.log("✅ Admin password updated successfully");
      } else {
        console.error("❌ Failed to update admin password");
      }
    } else {
      console.log("➕ Creating admin user...");

      // Create admin user
      const hashedPassword = await bcrypt.hash("admin123", 12);

      const insertResult = await query(
        `INSERT INTO users (name, email, role, password_hash, department, employee_id, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          "Humphrey Njoroge",
          "admin@tsoam.org",
          "admin",
          hashedPassword,
          "Administration",
          "TSOAM-ADM-001",
          1
        ]
      );

      if (insertResult.success) {
        console.log("✅ Admin user created successfully");
      } else {
        console.error("❌ Failed to create admin user:", insertResult.error);
      }
    }

    // Verify login works
    console.log("🔍 Testing admin login...");
    const testUserResult = await query(
      "SELECT * FROM users WHERE email = ? AND is_active = 1",
      ["admin@tsoam.org"]
    );

    if (testUserResult.success && testUserResult.data.length > 0) {
      const user = testUserResult.data[0];
      const passwordMatch = await bcrypt.compare("admin123", user.password_hash);

      if (passwordMatch) {
        console.log("✅ Admin login credentials verified successfully");
        console.log("📋 Admin user details:");
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);
      } else {
        console.error("❌ Admin password verification failed");
      }
    } else {
      console.error("❌ Admin user not found after creation");
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔐 Admin Login Credentials:");
    console.log("   Email: admin@tsoam.org");
    console.log("   Password: admin123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    console.error("❌ Failed to fix admin user:", error.message);
    process.exit(1);
  }
}

// Run the fix
if (require.main === module) {
  fixAdminUser();
}

module.exports = { fixAdminUser };
