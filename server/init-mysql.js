#!/usr/bin/env node

/**
 * MySQL Database Initialization Script for TSOAM Church Management System
 * This script creates the database and tables if they don't exist
 */

const mysql = require("mysql2/promise");
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
};

async function initializeMySQL() {
  try {
    console.log("🔄 Initializing MySQL database for TSOAM Church Management System...");
    console.log("📍 Connecting to:", dbConfig.host + ":" + dbConfig.port);
    console.log("👤 User:", dbConfig.user);
    console.log("🗄️  Database:", dbConfig.database);

    // Connect without database first to create it
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true,
    });

    console.log("✅ Connected to MySQL server");

    // Create database if it doesn't exist
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✅ Database '${dbConfig.database}' created/verified`);

    // Switch to the specific database
    await connection.execute(`USE ${dbConfig.database}`);
    console.log(`✅ Using database: ${dbConfig.database}`);

    // Check if schema file exists and read it
    const schemaPath = path.join(__dirname, "../database/schemas/schema.sql");
    if (fs.existsSync(schemaPath)) {
      console.log("📋 Reading schema file...");
      const schema = fs.readFileSync(schemaPath, "utf8");
      
      // Execute schema
      await connection.execute(schema);
      console.log("✅ Database schema applied successfully");
    } else {
      console.log("⚠️  Schema file not found, creating basic tables...");
      
      // Create basic tables
      const basicSchema = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          role ENUM('admin', 'pastor', 'hr', 'finance', 'user') DEFAULT 'user',
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS members (
          id INT AUTO_INCREMENT PRIMARY KEY,
          member_id VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(20),
          status ENUM('active', 'inactive') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          sender_id INT,
          recipient_type ENUM('member', 'employee', 'group') DEFAULT 'member',
          recipient_ids JSON,
          message_type ENUM('SMS', 'Email', 'Internal') DEFAULT 'SMS',
          subject VARCHAR(255),
          content TEXT NOT NULL,
          status ENUM('sent', 'delivered', 'failed') DEFAULT 'sent',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sender_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS inventory (
          id INT AUTO_INCREMENT PRIMARY KEY,
          item_code VARCHAR(50) UNIQUE NOT NULL,
          item_name VARCHAR(255) NOT NULL,
          category VARCHAR(100),
          status ENUM('working', 'faulty', 'maintenance', 'missing', 'disposed') DEFAULT 'working',
          location VARCHAR(255),
          current_value DECIMAL(10,2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS financial_transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          transaction_type ENUM('income', 'expense') NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          description TEXT,
          category VARCHAR(100),
          transaction_date DATE NOT NULL,
          created_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS system_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          action VARCHAR(255) NOT NULL,
          module VARCHAR(100) NOT NULL,
          details TEXT,
          severity ENUM('Info', 'Warning', 'Error', 'Security') DEFAULT 'Info',
          user_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `;
      
      await connection.execute(basicSchema);
      console.log("✅ Basic database schema created");
    }

    // Check created tables
    const [tables] = await connection.execute("SHOW TABLES");
    console.log(`✅ Database initialized with ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    // Insert default admin user if users table is empty
    const [users] = await connection.execute("SELECT COUNT(*) as count FROM users");
    if (users[0].count === 0) {
      console.log("👤 Creating default admin user...");
      
      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash("admin123", 12);
      
      await connection.execute(
        "INSERT INTO users (name, email, role, password) VALUES (?, ?, ?, ?)",
        ["Humphrey Njoroge", "admin@tsoam.org", "admin", hashedPassword]
      );
      console.log("✅ Default admin user created (admin@tsoam.org / admin123)");
    }

    await connection.end();
    console.log("🎉 MySQL database initialization completed successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔗 Connection Details:");
    console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    console.error("❌ MySQL initialization failed:", error.message);
    console.error("🔧 Please ensure:");
    console.error("   1. MySQL server is running");
    console.error("   2. User has database creation privileges");
    console.error("   3. Connection details are correct");
    console.error("   4. Firewall allows MySQL connections");
    process.exit(1);
  }
}

// Run initialization
if (require.main === module) {
  initializeMySQL();
}

module.exports = { initializeMySQL };
