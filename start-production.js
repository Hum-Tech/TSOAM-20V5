#!/usr/bin/env node

/**
 * Production Startup Script for TSOAM Church Management System
 * Validates system readiness and starts the production server
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tsoam_church_db",
};

async function startProduction() {
  console.log("🚀 TSOAM Church Management System - Production Startup");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    // Step 1: System validation
    console.log("🔧 Step 1: System validation...");
    
    // Check if build exists
    const buildPath = path.join(__dirname, 'client/dist');
    if (!fs.existsSync(buildPath)) {
      console.error("❌ Production build not found. Run 'npm run build-production' first");
      process.exit(1);
    }
    console.log("✅ Production build verified");

    // Check server files
    const serverPath = path.join(__dirname, 'server/server.js');
    if (!fs.existsSync(serverPath)) {
      console.error("❌ Server file not found");
      process.exit(1);
    }
    console.log("✅ Server files verified");

    // Step 2: Database connectivity test
    console.log("🔧 Step 2: Database connectivity test...");
    
    let databaseReady = false;
    try {
      const connection = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
      });
      
      // Check if database exists
      const [databases] = await connection.execute("SHOW DATABASES");
      const dbExists = databases.some(db => Object.values(db)[0] === dbConfig.database);
      
      if (dbExists) {
        // Connect to specific database and check tables
        await connection.execute(`USE ${dbConfig.database}`);
        const [tables] = await connection.execute("SHOW TABLES");
        
        if (tables.length >= 10) {
          console.log(`✅ MySQL database ready (${tables.length} tables)`);
          databaseReady = true;
        } else {
          console.log(`⚠️  MySQL database exists but needs initialization (${tables.length} tables)`);
          console.log("🔄 Run 'npm run mysql:production' to initialize");
        }
      } else {
        console.log("⚠️  MySQL database doesn't exist");
        console.log("🔄 Run 'npm run mysql:production' to setup");
      }
      
      await connection.end();
    } catch (error) {
      console.log("⚠️  MySQL connection failed:", error.message);
      console.log("🔄 Will use SQLite fallback");
    }

    // Step 3: Environment check
    console.log("🔧 Step 3: Environment configuration...");
    
    const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'];
    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingVars.length > 0) {
      console.log("⚠️  Missing environment variables:", missingVars);
      console.log("🔧 Using default values");
    } else {
      console.log("✅ Environment configuration complete");
    }

    // Step 4: Port availability check
    console.log("🔧 Step 4: Port availability check...");
    const serverPort = process.env.PORT || 3001;
    
    try {
      // Quick port check by trying to create a server
      const net = require('net');
      const server = net.createServer();
      
      await new Promise((resolve, reject) => {
        server.listen(serverPort, '0.0.0.0', () => {
          server.close(() => resolve());
        });
        server.on('error', reject);
      });
      
      console.log(`✅ Port ${serverPort} is available`);
    } catch (error) {
      console.error(`❌ Port ${serverPort} is already in use`);
      console.log("🔧 Stop any existing server or change PORT in .env");
      process.exit(1);
    }

    // Step 5: Start the server
    console.log("🔧 Step 5: Starting production server...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🌐 Server will be available at:");
    console.log(`   Local:   http://localhost:${serverPort}`);
    console.log(`   Network: http://[YOUR-IP]:${serverPort}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔐 Default Admin Login:");
    console.log("   Email: admin@tsoam.org");
    console.log("   Password: admin123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔄 Starting server now...");
    console.log("");

    // Start the server process
    const serverProcess = spawn('node', ['server/server.js'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });

    // Handle process events
    serverProcess.on('error', (error) => {
      console.error('❌ Failed to start server:', error.message);
      process.exit(1);
    });

    serverProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(`❌ Server exited with code ${code}`);
        process.exit(code);
      }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🔄 Gracefully shutting down server...');
      serverProcess.kill('SIGTERM');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🔄 Gracefully shutting down server...');
      serverProcess.kill('SIGTERM');
      process.exit(0);
    });

  } catch (error) {
    console.error("❌ Production startup failed:", error.message);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔧 Troubleshooting:");
    console.log("   1. Run 'npm run build-production' to rebuild");
    console.log("   2. Run 'npm run mysql:production' for database setup");
    console.log("   3. Check .env file configuration");
    console.log("   4. Ensure no other service is using the port");
    console.log("━━━━━���━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    process.exit(1);
  }
}

// Run startup
if (require.main === module) {
  startProduction();
}

module.exports = { startProduction };
