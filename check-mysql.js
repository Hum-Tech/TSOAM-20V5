#!/usr/bin/env node

/**
 * MySQL Connection Checker for TSOAM Church Management System
 * Checks if MySQL is available and provides setup instructions
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
};

async function checkMySQL() {
  console.log("🔍 TSOAM MySQL Connection Checker");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📍 Checking connection to: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`👤 User: ${dbConfig.user}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    console.log("✅ MySQL connection successful!");
    
    // Check MySQL version
    const [rows] = await connection.execute("SELECT VERSION() as version");
    console.log(`📊 MySQL Version: ${rows[0].version}`);

    // Check databases
    const [databases] = await connection.execute("SHOW DATABASES");
    console.log(`📁 Found ${databases.length} databases`);

    await connection.end();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🚀 Ready to initialize TSOAM database!");
    console.log("💻 Run: npm run db:init");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    console.log("❌ MySQL connection failed!");
    console.log(`🔴 Error: ${error.message}`);
    console.log("");
    console.log("🔧 TROUBLESHOOTING GUIDE:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    if (error.code === 'ECONNREFUSED') {
      console.log("❌ MySQL server is not running");
      console.log("");
      console.log("🔧 How to start MySQL:");
      console.log("   📱 XAMPP: Open XAMPP Control Panel → Start MySQL");
      console.log("   🖥️  WAMP: Open WAMP → Start MySQL service");
      console.log("   💻 MAMP: Open MAMP → Start MySQL");
      console.log("   🔧 Windows Service: services.msc → Start MySQL service");
      console.log("   🐧 Linux: sudo systemctl start mysql");
      console.log("   🍎 macOS: brew services start mysql");
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log("❌ Access denied - Check your credentials");
      console.log("");
      console.log("🔧 Solution:");
      console.log("   1. Check .env file credentials");
      console.log("   2. Verify MySQL username/password");
      console.log("   3. Grant privileges to user");
    } else {
      console.log("❌ Unknown connection error");
      console.log("");
      console.log("🔧 General solutions:");
      console.log("   1. Verify MySQL is installed");
      console.log("   2. Check firewall settings");
      console.log("   3. Verify port 3306 is open");
    }
    
    console.log("");
    console.log("📝 Environment variables (.env file):");
    console.log("   DB_HOST=localhost");
    console.log("   DB_PORT=3306");
    console.log("   DB_USER=root");
    console.log("   DB_PASSWORD=your_password");
    console.log("   DB_NAME=tsoam_church_db");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  }
}

// Run the check
checkMySQL();
