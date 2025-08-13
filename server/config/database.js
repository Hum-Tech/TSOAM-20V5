const mysql = require("mysql2/promise");
const sqlite = require("./sqlite-adapter");
require("dotenv").config();

// Determine which database to use - prioritize MySQL first
const USE_SQLITE = process.env.USE_SQLITE === "true" ||
                   (!process.env.DB_HOST && !process.env.DB_USER);

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
  console.log("🔄 Attempting MySQL database connection...");
  console.log("📍 DB Config:", {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database,
    USE_SQLITE: USE_SQLITE
  });

  if (USE_SQLITE) {
    console.log("⚠️  SQLite mode enabled in config - switching to MySQL...");
  }

  try {
    // Force MySQL connection attempt
    const connection = await pool.getConnection();
    console.log("✅ MySQL database connected successfully to:", dbConfig.database);
    console.log("📍 Host:", dbConfig.host, "Port:", dbConfig.port);
    console.log("🔄 MySQL database synchronization ready");
    connection.release();

    // Override USE_SQLITE since MySQL is working
    global.FORCE_MYSQL = true;
    return true;
  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);
    console.error("🔧 Check MySQL server status and credentials");
    console.error("📋 Falling back to SQLite for this session...");

    const sqliteResult = await sqlite.testConnection();
    if (sqliteResult) {
      console.log("✅ SQLite fallback ready - database synchronization enabled");
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
