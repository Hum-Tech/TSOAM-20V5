const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, "..", "database");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "tsoam_church.db");

// Initialize SQLite database
let db = null;

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("❌ SQLite connection failed:", err.message);
        reject(err);
        return;
      }
      console.log("✅ SQLite database connected:", dbPath);
      
      // Enable foreign keys
      db.run("PRAGMA foreign_keys = ON");
      
      // Create tables
      createTables()
        .then(() => {
          console.log("✅ Database tables initialized");
          resolve(true);
        })
        .catch((err) => {
          console.error("❌ Table creation failed:", err);
          reject(err);
        });
    });
  });
}

function createTables() {
  return new Promise((resolve, reject) => {
    const schema = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('Admin', 'HR Officer', 'Finance Officer', 'User')),
        department TEXT,
        employee_id TEXT,
        phone TEXT,
        is_active BOOLEAN DEFAULT 1,
        can_create_accounts BOOLEAN DEFAULT 0,
        can_delete_accounts BOOLEAN DEFAULT 0,
        profile_picture TEXT,
        address TEXT,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      );

      -- Password resets table
      CREATE TABLE IF NOT EXISTS password_resets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        reset_code TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        used BOOLEAN DEFAULT 0,
        ip_address TEXT,
        user_agent TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- Members table
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        member_id TEXT UNIQUE NOT NULL,
        tithe_number TEXT UNIQUE,
        full_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        date_of_birth DATE,
        gender TEXT CHECK (gender IN ('Male', 'Female')),
        marital_status TEXT CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed')),
        address TEXT,
        occupation TEXT,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        membership_date DATE,
        baptism_date DATE,
        confirmation_date DATE,
        department TEXT,
        position TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Employees table
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT UNIQUE NOT NULL,
        member_id TEXT,
        full_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        date_of_birth DATE,
        gender TEXT CHECK (gender IN ('Male', 'Female')),
        marital_status TEXT,
        national_id TEXT,
        kra_pin TEXT,
        nhif_number TEXT,
        nssf_number TEXT,
        department TEXT NOT NULL,
        position TEXT NOT NULL,
        employment_type TEXT CHECK (employment_type IN ('Full-time', 'Part-time', 'Volunteer')),
        employment_status TEXT CHECK (employment_status IN ('Active', 'Suspended', 'Terminated', 'On Leave')),
        hire_date DATE,
        contract_end_date DATE,
        basic_salary DECIMAL(10,2) DEFAULT 0,
        housing_allowance DECIMAL(10,2) DEFAULT 0,
        transport_allowance DECIMAL(10,2) DEFAULT 0,
        medical_allowance DECIMAL(10,2) DEFAULT 0,
        other_allowances DECIMAL(10,2) DEFAULT 0,
        bank_name TEXT,
        account_number TEXT,
        branch_code TEXT,
        emergency_contact_name TEXT,
        emergency_contact_relationship TEXT,
        emergency_contact_phone TEXT,
        education TEXT,
        skills TEXT,
        performance_rating DECIMAL(3,2),
        last_review_date DATE,
        next_review_date DATE,
        annual_leave_balance INTEGER DEFAULT 21,
        sick_leave_balance INTEGER DEFAULT 30,
        maternity_leave_balance INTEGER DEFAULT 90,
        paternity_leave_balance INTEGER DEFAULT 14,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id)
      );

      -- Performance reviews table
      CREATE TABLE IF NOT EXISTS performance_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT NOT NULL,
        review_period TEXT NOT NULL,
        review_type TEXT CHECK (review_type IN ('annual', 'quarterly', 'probationary')),
        overall_rating DECIMAL(3,2),
        job_knowledge_rating DECIMAL(3,2),
        quality_of_work_rating DECIMAL(3,2),
        productivity_rating DECIMAL(3,2),
        communication_rating DECIMAL(3,2),
        teamwork_rating DECIMAL(3,2),
        initiative_rating DECIMAL(3,2),
        reliability_rating DECIMAL(3,2),
        strengths TEXT,
        areas_for_improvement TEXT,
        goals TEXT,
        development_plan TEXT,
        manager_comments TEXT,
        employee_comments TEXT,
        reviewer_name TEXT,
        review_date DATE,
        status TEXT CHECK (status IN ('completed', 'pending', 'in-progress')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
      );

      -- Transactions table
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id TEXT UNIQUE NOT NULL,
        type TEXT CHECK (type IN ('Income', 'Expense')),
        category TEXT NOT NULL,
        subcategory TEXT,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        payment_method TEXT,
        reference_number TEXT,
        member_id TEXT,
        created_by TEXT,
        approved_by TEXT,
        status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'approved',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      -- Events table
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        event_type TEXT,
        start_date DATETIME NOT NULL,
        end_date DATETIME,
        location TEXT,
        organizer TEXT,
        max_attendees INTEGER,
        registration_deadline DATETIME,
        is_recurring BOOLEAN DEFAULT 0,
        recurrence_pattern TEXT,
        status TEXT CHECK (status IN ('draft', 'published', 'cancelled', 'completed')) DEFAULT 'draft',
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      -- Appointments table
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        appointment_date DATETIME NOT NULL,
        duration INTEGER DEFAULT 60,
        type TEXT,
        location TEXT,
        attendee_name TEXT,
        attendee_email TEXT,
        attendee_phone TEXT,
        status TEXT CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')) DEFAULT 'scheduled',
        created_by TEXT,
        assigned_to TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id)
      );
    `;

    db.exec(schema, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function query(sql, params = []) {
  return new Promise((resolve) => {
    if (!db) {
      resolve({ success: false, error: "Database not initialized" });
      return;
    }

    // Convert MySQL syntax to SQLite where needed
    let sqliteSql = sql
      .replace(/AUTO_INCREMENT/gi, "AUTOINCREMENT")
      .replace(/VARCHAR\(\d+\)/gi, "TEXT")
      .replace(/DATETIME/gi, "DATETIME")
      .replace(/CURRENT_TIMESTAMP/gi, "CURRENT_TIMESTAMP");

    if (sql.toLowerCase().includes("select") || sql.toLowerCase().includes("show")) {
      db.all(sqliteSql, params, (err, rows) => {
        if (err) {
          console.error("SQLite query error:", err.message);
          resolve({ success: false, error: err.message });
        } else {
          resolve({ success: true, data: rows });
        }
      });
    } else {
      db.run(sqliteSql, params, function(err) {
        if (err) {
          console.error("SQLite query error:", err.message);
          resolve({ success: false, error: err.message });
        } else {
          resolve({ success: true, data: { insertId: this.lastID, affectedRows: this.changes } });
        }
      });
    }
  });
}

function testConnection() {
  return new Promise((resolve) => {
    if (db) {
      resolve(true);
    } else {
      initializeDatabase()
        .then(() => resolve(true))
        .catch(() => resolve(false));
    }
  });
}

function closeDatabase() {
  return new Promise((resolve) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error("Error closing database:", err);
        } else {
          console.log("✅ SQLite database closed");
        }
        resolve();
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  initializeDatabase,
  query,
  testConnection,
  closeDatabase,
  dbConfig: { database: "SQLite", path: dbPath }
};
