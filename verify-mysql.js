#!/usr/bin/env node

/**
 * MySQL Setup Verification Script for TSOAM Church Management System
 * This script verifies MySQL connection and provides setup instructions
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tsoam_church_db",
  multipleStatements: true,
};

async function verifyMySQLSetup() {
  console.log("🔄 TSOAM Church Management System - MySQL Setup Verification");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📍 Configuration:");
  console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`   User: ${dbConfig.user}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    // Test connection without database first
    console.log("🔧 Testing MySQL server connection...");
    const serverConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    console.log("✅ MySQL server connection successful!");

    // Check if database exists
    console.log(`🔍 Checking if database '${dbConfig.database}' exists...`);
    const [databases] = await serverConnection.execute("SHOW DATABASES");
    const dbExists = databases.some(db => Object.values(db)[0] === dbConfig.database);

    if (!dbExists) {
      console.log(`⚠️  Database '${dbConfig.database}' does not exist`);
      console.log("🔧 Creating database...");
      
      await serverConnection.execute(
        `CREATE DATABASE ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      console.log(`✅ Database '${dbConfig.database}' created successfully!`);
    } else {
      console.log(`✅ Database '${dbConfig.database}' exists`);
    }

    await serverConnection.end();

    // Test connection to specific database
    console.log("🔗 Testing database connection...");
    const dbConnection = await mysql.createConnection(dbConfig);
    
    // Check tables
    const [tables] = await dbConnection.execute("SHOW TABLES");
    console.log(`📊 Found ${tables.length} tables in database`);
    
    if (tables.length > 0) {
      console.log("📋 Existing tables:");
      tables.forEach(table => {
        console.log(`   - ${Object.values(table)[0]}`);
      });
    } else {
      console.log("📝 Database is empty - tables will be created on server start");
    }

    await dbConnection.end();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 MySQL setup verification completed successfully!");
    console.log("✅ MySQL server is accessible");
    console.log("✅ Database is ready");
    console.log("✅ Connection parameters are correct");
    console.log("��━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🚀 Next steps:");
    console.log("   1. Run 'npm run db:init' to create all tables");
    console.log("   2. Run 'npm start' to start the server");
    console.log("   3. Access http://localhost:3004 in your browser");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    console.error("❌ MySQL setup verification failed:", error.message);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔧 Troubleshooting Guide:");
    console.log("");
    
    if (error.code === 'ECONNREFUSED') {
      console.log("❌ Connection Refused - MySQL server is not running");
      console.log("🔧 Solutions:");
      console.log("   1. Start MySQL server:");
      console.log("      - Windows: Start MySQL service in Services");
      console.log("      - macOS: brew services start mysql");
      console.log("      - Linux: sudo systemctl start mysql");
      console.log("");
      console.log("   2. Or use XAMPP/WAMP/MAMP and start MySQL from there");
      console.log("");
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log("❌ Access Denied - Authentication failed");
      console.log("🔧 Solutions:");
      console.log("   1. Check username and password in .env file");
      console.log("   2. Update DB_USER and DB_PASSWORD in .env");
      console.log("   3. Or create .env file with correct credentials");
      console.log("");
    } else {
      console.log(`❌ Error: ${error.message}`);
      console.log("🔧 General solutions:");
      console.log("   1. Verify MySQL is installed and running");
      console.log("   2. Check firewall settings");
      console.log("   3. Verify connection parameters");
      console.log("");
    }

    console.log("📋 Environment Configuration:");
    console.log("   Create or update .env file in project root with:");
    console.log("");
    console.log("   DB_HOST=localhost");
    console.log("   DB_PORT=3306");
    console.log("   DB_USER=root");
    console.log("   DB_PASSWORD=your_mysql_password");
    console.log("   DB_NAME=tsoam_church_db");
    console.log("");
    console.log("🔄 The system will fallback to SQLite if MySQL is unavailable");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    process.exit(1);
  }
}

// Run verification
if (require.main === module) {
  verifyMySQLSetup();
}

module.exports = { verifyMySQLSetup };
