#!/usr/bin/env node

const mysql = require("mysql2/promise");

async function testMySQLConnection() {
  console.log("🔍 Testing MySQL connection for TSOAM Church Management System...");
  
  const configs = [
    // Default configuration
    {
      host: "localhost",
      port: 3306,
      user: "root",
      password: "",
      name: "Default (root, no password)"
    },
    // Alternative configurations
    {
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "",
      name: "Alternative IP (127.0.0.1)"
    },
    {
      host: "localhost",
      port: 3306,
      user: "root",
      password: "root",
      name: "Root with 'root' password"
    },
    {
      host: "localhost",
      port: 3306,
      user: "root",
      password: "password",
      name: "Root with 'password' password"
    }
  ];

  for (const config of configs) {
    try {
      console.log(`\n📡 Trying: ${config.name}`);
      console.log(`   Host: ${config.host}:${config.port}`);
      console.log(`   User: ${config.user}`);
      
      const connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        connectTimeout: 5000,
      });

      console.log("✅ Connection successful!");
      
      // Test database creation
      await connection.execute("CREATE DATABASE IF NOT EXISTS tsoam_church_db");
      console.log("✅ Database creation/verification successful!");
      
      // Test switching to database
      await connection.execute("USE tsoam_church_db");
      console.log("✅ Database selection successful!");
      
      await connection.end();
      
      console.log("\n🎉 SUCCESS! Use this configuration:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`DB_HOST=${config.host}`);
      console.log(`DB_PORT=${config.port}`);
      console.log(`DB_USER=${config.user}`);
      console.log(`DB_PASSWORD=${config.password}`);
      console.log(`DB_NAME=tsoam_church_db`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      return config;
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message.split('\n')[0]}`);
    }
  }
  
  console.log("\n❌ All MySQL connection attempts failed!");
  console.log("\n🔧 Troubleshooting steps:");
  console.log("1. Ensure MySQL server is running");
  console.log("2. Check if MySQL is installed");
  console.log("3. Verify port 3306 is not blocked");
  console.log("4. Try connecting with MySQL Workbench or command line");
  console.log("5. Check MySQL user permissions");
  
  return null;
}

testMySQLConnection();
