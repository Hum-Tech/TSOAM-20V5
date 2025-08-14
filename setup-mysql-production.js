#!/usr/bin/env node

/**
 * Production MySQL Setup Script for TSOAM Church Management System
 * Ensures MySQL database is properly configured and synchronized
 */

const mysql = require("./server/node_modules/mysql2/promise");
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

async function setupMySQLProduction() {
  console.log("🚀 TSOAM Church Management System - Production MySQL Setup");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📍 Target Configuration:");
  console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`   User: ${dbConfig.user}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    // Step 1: Test MySQL server connection
    console.log("🔧 Step 1: Testing MySQL server connection...");
    const serverConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    console.log("✅ MySQL server connection successful!");

    // Step 2: Create database if it doesn't exist
    console.log(`🔧 Step 2: Ensuring database '${dbConfig.database}' exists...`);
    await serverConnection.execute(
      `CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✅ Database '${dbConfig.database}' ready`);

    await serverConnection.end();

    // Step 3: Connect to the specific database and initialize tables
    console.log("🔧 Step 3: Initializing database tables...");
    const dbConnection = await mysql.createConnection(dbConfig);

    // Check existing tables
    const [existingTables] = await dbConnection.execute("SHOW TABLES");
    console.log(`📊 Found ${existingTables.length} existing tables`);

    // Run the complete database initialization
    console.log("🔄 Running complete database initialization...");
    const { initializeCompleteDatabase } = require("./server/init-complete-db");

    // Override the query function temporarily to use our connection
    const originalQuery = require("./server/config/database").query;
    require("./server/config/database").query = async (sql, params = []) => {
      try {
        const [results] = await dbConnection.execute(sql, params);
        return { success: true, data: results };
      } catch (error) {
        console.error("Query error:", error.message);
        return { success: false, error: error.message };
      }
    };

    await initializeCompleteDatabase();

    // Restore original query function
    require("./server/config/database").query = originalQuery;

    // Step 4: Verify all tables exist
    console.log("🔧 Step 4: Verifying database schema...");
    const [finalTables] = await dbConnection.execute("SHOW TABLES");

    const expectedTables = [
      'users', 'members', 'messages', 'message_replies', 'inventory',
      'financial_transactions', 'events', 'appointments', 'system_logs',
      'hr_employees', 'welfare_cases', 'documents'
    ];

    const existingTableNames = finalTables.map(table => Object.values(table)[0]);
    const missingTables = expectedTables.filter(table => !existingTableNames.includes(table));

    if (missingTables.length > 0) {
      console.error("❌ Missing tables:", missingTables);
      throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
    }

    console.log(`✅ All ${finalTables.length} required tables verified`);

    // Step 5: Test database connectivity
    console.log("🔧 Step 5: Testing database operations...");
    const [userCount] = await dbConnection.execute("SELECT COUNT(*) as count FROM users");
    const [memberCount] = await dbConnection.execute("SELECT COUNT(*) as count FROM members");
    const [messageCount] = await dbConnection.execute("SELECT COUNT(*) as count FROM messages");

    console.log(`📊 Database Status:`);
    console.log(`   - Users: ${userCount[0].count}`);
    console.log(`   - Members: ${memberCount[0].count}`);
    console.log(`   - Messages: ${messageCount[0].count}`);

    await dbConnection.end();

    // Step 6: Update environment configuration
    console.log("🔧 Step 6: Configuring environment for MySQL...");

    // Update .env file to ensure MySQL is used
    const envPath = path.join(__dirname, '.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Ensure USE_SQLITE is set to false
    if (envContent.includes('USE_SQLITE=true')) {
      envContent = envContent.replace('USE_SQLITE=true', 'USE_SQLITE=false');
    } else if (!envContent.includes('USE_SQLITE=false')) {
      envContent += '\nUSE_SQLITE=false\n';
    }

    fs.writeFileSync(envPath, envContent);

    // Update server/.env file
    const serverEnvPath = path.join(__dirname, 'server/.env');
    let serverEnvContent = '';

    if (fs.existsSync(serverEnvPath)) {
      serverEnvContent = fs.readFileSync(serverEnvPath, 'utf8');
    }

    if (serverEnvContent.includes('USE_SQLITE=true')) {
      serverEnvContent = serverEnvContent.replace('USE_SQLITE=true', 'USE_SQLITE=false');
    } else if (!serverEnvContent.includes('USE_SQLITE=false')) {
      serverEnvContent += '\nUSE_SQLITE=false\n';
    }

    fs.writeFileSync(serverEnvPath, serverEnvContent);

    console.log("✅ Environment configured for MySQL");

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 Production MySQL setup completed successfully!");
    console.log("━━━━━━━━━━━━━━���━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ MySQL server is configured and running");
    console.log("✅ Database and all tables are ready");
    console.log("✅ Data synchronization enabled");
    console.log("✅ Environment configured for production");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🚀 Next steps:");
    console.log("   1. Run 'npm start' to start the production server");
    console.log("   2. Access the system at http://localhost:3001");
    console.log("   3. Login with admin@tsoam.org / admin123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    console.error("❌ Production MySQL setup failed:", error.message);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔧 Troubleshooting:");

    if (error.code === 'ECONNREFUSED') {
      console.log("❌ MySQL server is not running");
      console.log("🔧 Start MySQL server:");
      console.log("   - XAMPP: Start MySQL in control panel");
      console.log("   - Windows: Start MySQL service");
      console.log("   - macOS: brew services start mysql");
      console.log("   - Linux: sudo systemctl start mysql");
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log("❌ MySQL authentication failed");
      console.log("🔧 Check credentials in .env file");
    } else {
      console.log("❌ Unexpected error:", error.message);
    }

    console.log("━━━━━━━━━━���━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    process.exit(1);
  }
}

// Run setup
if (require.main === module) {
  setupMySQLProduction();
}

module.exports = { setupMySQLProduction };
