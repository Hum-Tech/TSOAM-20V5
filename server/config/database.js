const mysql = require("mysql2/promise");
const sqlite = require("./sqlite-adapter");
require("dotenv").config();

// Determine which database to use - prioritize MySQL first
const USE_SQLITE = process.env.USE_SQLITE === "true";

// Database configuration for localhost deployment
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tsoam_church_db",
  charset: "utf8mb4",
  connectionLimit: 20,
  queueLimit: 0,
  multipleStatements: true,
};

// Create connection pool for better performance (MySQL)
const pool = mysql.createPool(dbConfig);

// Test database connection with MySQL priority
async function testConnection() {
  console.log("🔄 Testing database connection...");
  console.log("📍 Configuration:", {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database,
    USE_SQLITE: USE_SQLITE
  });

  // If explicitly set to use SQLite, skip MySQL
  if (USE_SQLITE) {
    console.log("📋 SQLite mode explicitly enabled in configuration");
    const sqliteResult = await sqlite.testConnection();
    if (sqliteResult) {
      console.log("✅ SQLite database ready");
    }
    return sqliteResult;
  }

  try {
    // Attempt MySQL connection
    console.log("🔗 Attempting MySQL connection...");
    const connection = await pool.getConnection();
    console.log("✅ MySQL database connected successfully!");
    console.log("📍 Database:", dbConfig.database, "on", dbConfig.host + ":" + dbConfig.port);
    console.log("🔄 MySQL synchronization enabled");
    connection.release();

    // Mark as MySQL successful
    global.FORCE_MYSQL = true;
    return true;
  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log("🔧 MySQL server is not running on localhost:3306");
      console.log("📋 Solutions:");
      console.log("   1. Start MySQL server (mysqld, XAMPP, WAMP, etc.)");
      console.log("   2. Or set USE_SQLITE=true in .env to use SQLite");
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log("🔧 Check MySQL credentials in .env file");
    }

    console.log("🔄 Falling back to SQLite...");
    const sqliteResult = await sqlite.testConnection();
    if (sqliteResult) {
      console.log("✅ SQLite fallback ready - system operational");
    }
    return sqliteResult;
  }
}

// Initialize database (create tables if they don't exist)
async function initializeDatabase() {
  if (USE_SQLITE) {
    console.log("🔄 SQLite database already initialized");
    return true;
  }

  try {
    console.log("🔄 Initializing MySQL database...");

    // Check if database exists, create if not
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true,
    });

    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await connection.end();

    // Now connect to the specific database
    const dbConnection = await pool.getConnection();

    // Check if tables exist
    const [tables] = await dbConnection.execute("SHOW TABLES");

    if (tables.length === 0) {
      console.log("📦 Database is empty, please run the schema.sql file");
      console.log(
        "💻 Command: mysql -u root -p tsoam_church_db < database/schema.sql",
      );
    } else {
      console.log(`✅ Database initialized with ${tables.length} tables`);
    }

    dbConnection.release();
    return true;
  } catch (error) {
    console.error("❌ MySQL initialization failed:", error.message);
    console.log("🔄 Using SQLite as fallback");
    return true; // SQLite is already initialized
  }
}

// Execute query with MySQL priority
async function query(sql, params = []) {
  // Try MySQL first unless explicitly disabled
  if (!USE_SQLITE || global.FORCE_MYSQL) {
    try {
      const [results] = await pool.execute(sql, params);
      console.log("✅ MySQL query executed successfully");
      return { success: true, data: results };
    } catch (error) {
      console.error("❌ MySQL query error:", error.message);
      if (global.FORCE_MYSQL) {
        throw error; // Don't fallback if we're forcing MySQL
      }
      console.log("🔄 Falling back to SQLite for this query...");
    }
  }

  // Fallback to SQLite
  return await sqlite.query(sql, params);
}

// Get connection from pool
async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error("Failed to get database connection:", error.message);
    throw error;
  }
}

// Close all connections
async function closePool() {
  try {
    await pool.end();
    console.log("🔌 Database connection pool closed");
  } catch (error) {
    console.error("Error closing database pool:", error.message);
  }
}

module.exports = {
  pool,
  query,
  getConnection,
  testConnection,
  initializeDatabase,
  closePool,
  dbConfig,
};
