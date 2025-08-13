#!/usr/bin/env node

/**
 * MySQL 8.0 Optimized Database Initialization for TSOAM Church Management System
 * Production-ready with proper indexing, constraints, and security
 */

const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tsoam_church_db",
  multipleStatements: true,
  charset: "utf8mb4"
};

async function initializeMySQL8Database() {
  console.log("🚀 TSOAM Church Management System - MySQL 8.0 Database Setup");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📍 Target Configuration:");
  console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  let connection;

  try {
    // Step 1: Connect to MySQL server
    console.log("🔗 Step 1: Connecting to MySQL server...");
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true
    });

    console.log("✅ Connected to MySQL server successfully");

    // Step 2: Check MySQL version
    console.log("🔍 Step 2: Checking MySQL version...");
    const [versionResult] = await connection.execute("SELECT VERSION() as version");
    const mysqlVersion = versionResult[0].version;
    console.log(`✅ MySQL Version: ${mysqlVersion}`);

    if (!mysqlVersion.startsWith('8.')) {
      console.warn("⚠️  Warning: This script is optimized for MySQL 8.0+");
    }

    // Step 3: Set MySQL 8.0 compatible settings
    console.log("⚙️  Step 3: Configuring MySQL 8.0 settings...");
    await connection.execute("SET SQL_MODE = 'NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'");
    await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
    await connection.execute("SET SESSION group_concat_max_len = 1000000");
    console.log("✅ MySQL settings configured");

    // Step 4: Create database
    console.log("🏗️  Step 4: Creating database...");
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS ${dbConfig.database} 
       CHARACTER SET utf8mb4 
       COLLATE utf8mb4_unicode_ci`
    );
    await connection.execute(`USE ${dbConfig.database}`);
    console.log(`✅ Database '${dbConfig.database}' ready`);

    // Step 5: Read and execute schema
    console.log("📋 Step 5: Creating tables from schema...");
    const schemaPath = path.join(__dirname, "../database/mysql8_schema.sql");
    
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, "utf8");
      
      // Split schema into individual statements and execute
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await connection.execute(statement);
          } catch (error) {
            if (!error.message.includes('already exists')) {
              console.warn(`Warning executing statement: ${error.message}`);
            }
          }
        }
      }
    } else {
      // Create tables directly if schema file doesn't exist
      await createTablesDirectly(connection);
    }

    // Step 6: Verify tables
    console.log("🔍 Step 6: Verifying database structure...");
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
      [dbConfig.database]
    );

    const tableNames = tables.map(row => row.TABLE_NAME);
    const requiredTables = [
      'users', 'members', 'messages', 'message_replies', 'inventory',
      'financial_transactions', 'events', 'appointments', 'system_logs',
      'hr_employees', 'welfare_cases', 'documents', 'password_resets'
    ];

    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    if (missingTables.length > 0) {
      console.error("❌ Missing tables:", missingTables);
      throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
    }

    console.log(`✅ All ${tableNames.length} tables verified successfully`);

    // Step 7: Create admin user
    console.log("👤 Step 7: Setting up admin user...");
    const hashedPassword = await bcrypt.hash("admin123", 12);
    
    await connection.execute(
      `INSERT INTO users (name, email, role, password_hash, department, employee_id, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       password_hash = VALUES(password_hash), is_active = TRUE`,
      [
        "Humphrey Njoroge",
        "admin@tsoam.org",
        "admin",
        hashedPassword,
        "Administration",
        "TSOAM-ADM-001",
        true
      ]
    );
    console.log("✅ Admin user configured");

    // Step 8: Optimize tables
    console.log("⚡ Step 8: Optimizing database performance...");
    await connection.execute("OPTIMIZE TABLE users, members, messages, financial_transactions");
    console.log("✅ Database optimized");

    // Step 9: Show database summary
    console.log("📊 Step 9: Database summary...");
    const [userCount] = await connection.execute("SELECT COUNT(*) as count FROM users");
    const [memberCount] = await connection.execute("SELECT COUNT(*) as count FROM members");
    const [messageCount] = await connection.execute("SELECT COUNT(*) as count FROM messages");

    console.log("━━━━━━━━━━━━━━━━━━━��━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 MySQL 8.0 Database Setup Complete!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Database Statistics:");
    console.log(`   Users: ${userCount[0].count}`);
    console.log(`   Members: ${memberCount[0].count}`);
    console.log(`   Messages: ${messageCount[0].count}`);
    console.log(`   Tables: ${tableNames.length}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔐 Admin Credentials:");
    console.log("   Email: admin@tsoam.org");
    console.log("   Password: admin123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ System Ready for Production Deployment");

  } catch (error) {
    console.error("❌ Database setup failed:", error.message);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔧 Troubleshooting Guide:");
    
    if (error.code === 'ECONNREFUSED') {
      console.log("❌ MySQL server not running");
      console.log("   Start MySQL: systemctl start mysql (Linux) or MySQL service (Windows)");
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log("❌ Access denied - check credentials");
      console.log("   Update DB_USER and DB_PASSWORD in .env file");
    } else {
      console.log("❌ Error:", error.message);
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function createTablesDirectly(connection) {
  // Fallback table creation if schema file is missing
  const tables = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      role ENUM('admin', 'pastor', 'hr', 'finance', 'user') DEFAULT 'user',
      password_hash VARCHAR(255) NOT NULL,
      department VARCHAR(100),
      employee_id VARCHAR(50) UNIQUE,
      phone VARCHAR(20),
      is_active BOOLEAN DEFAULT FALSE,
      last_login TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Add other essential tables here if needed
  ];

  for (const tableSQL of tables) {
    await connection.execute(tableSQL);
  }
}

// Run initialization
if (require.main === module) {
  initializeMySQL8Database();
}

module.exports = { initializeMySQL8Database };
