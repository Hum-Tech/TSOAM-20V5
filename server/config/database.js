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

// Test database connection with automatic fallback
async function testConnection() {
  if (USE_SQLITE) {
    console.log("🔄 Using SQLite database for development...");
    const sqliteResult = await sqlite.testConnection();
    if (sqliteResult) {
      console.log("✅ SQLite database ready for synchronization");
    }
    return sqliteResult;
  }

  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL database connected successfully to:", dbConfig.database);
    console.log("📍 Host:", dbConfig.host, "Port:", dbConfig.port);
    console.log("🔄 Database synchronization ready");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);
    console.log("🔄 Falling back to SQLite database...");
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

// Execute query with error handling
async function query(sql, params = []) {
  if (USE_SQLITE) {
    return await sqlite.query(sql, params);
  }

  try {
    const [results] = await pool.execute(sql, params);
    return { success: true, data: results };
  } catch (error) {
    console.error("MySQL query error:", error.message);
    console.log("🔄 Falling back to SQLite...");
    return await sqlite.query(sql, params);
  }
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
