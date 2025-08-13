#!/usr/bin/env node

/**
 * Complete Database Initialization for TSOAM Church Management System
 * Creates all required tables for full data persistence
 */

const { query } = require("./config/database");
const bcrypt = require("bcrypt");

async function initializeCompleteDatabase() {
  console.log("🔄 Initializing complete TSOAM database schema...");
  
  try {
    // Create users table with enhanced fields
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        password_hash TEXT NOT NULL,
        department VARCHAR(100),
        employee_id VARCHAR(50) UNIQUE,
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT 0,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Users table created/verified");

    // Create members table
    await query(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        date_of_birth DATE,
        membership_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        service_group VARCHAR(100),
        emergency_contact VARCHAR(255),
        emergency_phone VARCHAR(20),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Members table created/verified");

    // Create messages table
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER,
        recipient_ids TEXT,
        message_type VARCHAR(20) DEFAULT 'Internal',
        subject VARCHAR(255),
        content TEXT NOT NULL,
        recipient_type VARCHAR(20) DEFAULT 'employee',
        status VARCHAR(20) DEFAULT 'sent',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id)
      )
    `);
    console.log("✅ Messages table created/verified");

    // Create inventory table
    await query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_code VARCHAR(50) UNIQUE NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        brand VARCHAR(100),
        model VARCHAR(100),
        description TEXT,
        location VARCHAR(255),
        current_value DECIMAL(10,2) DEFAULT 0,
        purchase_date DATE,
        purchase_price DECIMAL(10,2) DEFAULT 0,
        supplier VARCHAR(255),
        status VARCHAR(20) DEFAULT 'working',
        condition_status VARCHAR(20) DEFAULT 'good',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Inventory table created/verified");

    // Create financial_transactions table
    await query(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_type VARCHAR(20) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        account VARCHAR(100),
        reference_number VARCHAR(50),
        transaction_date DATE NOT NULL,
        created_by INTEGER,
        approved_by INTEGER,
        status VARCHAR(20) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      )
    `);
    console.log("✅ Financial transactions table created/verified");

    // Create events table
    await query(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATETIME NOT NULL,
        end_date DATETIME,
        location VARCHAR(255),
        organizer VARCHAR(255),
        category VARCHAR(100),
        status VARCHAR(20) DEFAULT 'scheduled',
        max_attendees INTEGER,
        registration_required BOOLEAN DEFAULT 0,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log("✅ Events table created/verified");

    // Create appointments table
    await query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        appointment_date DATETIME NOT NULL,
        duration INTEGER DEFAULT 30,
        attendee_name VARCHAR(255),
        attendee_phone VARCHAR(20),
        attendee_email VARCHAR(255),
        status VARCHAR(20) DEFAULT 'scheduled',
        type VARCHAR(100),
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log("✅ Appointments table created/verified");

    // Create system_logs table
    await query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action VARCHAR(255) NOT NULL,
        module VARCHAR(100) NOT NULL,
        details TEXT,
        severity VARCHAR(20) DEFAULT 'Info',
        user_id INTEGER,
        ip_address VARCHAR(45),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log("✅ System logs table created/verified");

    // Create hr_employees table
    await query(`
      CREATE TABLE IF NOT EXISTS hr_employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        department VARCHAR(100),
        position VARCHAR(100),
        salary DECIMAL(10,2),
        hire_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        emergency_contact VARCHAR(255),
        emergency_phone VARCHAR(20),
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ HR employees table created/verified");

    // Create welfare_cases table
    await query(`
      CREATE TABLE IF NOT EXISTS welfare_cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_number VARCHAR(50) UNIQUE NOT NULL,
        member_id INTEGER,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'open',
        amount_requested DECIMAL(10,2),
        amount_approved DECIMAL(10,2),
        created_by INTEGER,
        assigned_to INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id)
      )
    `);
    console.log("✅ Welfare cases table created/verified");

    // Create documents table
    await query(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_path VARCHAR(500),
        file_type VARCHAR(50),
        file_size INTEGER,
        category VARCHAR(100),
        uploaded_by INTEGER,
        access_level VARCHAR(20) DEFAULT 'private',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);
    console.log("✅ Documents table created/verified");

    // Insert default admin user if no users exist
    const existingUsers = await query("SELECT COUNT(*) as count FROM users");
    if (existingUsers.success && existingUsers.data[0].count === 0) {
      console.log("👤 Creating default admin user...");
      
      const hashedPassword = await bcrypt.hash("admin123", 12);
      
      await query(
        `INSERT INTO users (name, email, role, password_hash, department, employee_id, is_active, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          "Humphrey Njoroge", 
          "admin@tsoam.org", 
          "admin", 
          hashedPassword, 
          "Administration", 
          "TSOAM-ADM-001", 
          1
        ]
      );
      console.log("✅ Default admin user created (admin@tsoam.org / admin123)");
    }

    console.log("\n🎉 Complete database initialization successful!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Database Summary:");
    console.log("   ✅ Users & Authentication");
    console.log("   ✅ Church Members Management");
    console.log("   ✅ Internal Messaging System");
    console.log("   ✅ Inventory Management");
    console.log("   ✅ Financial Transactions");
    console.log("   ✅ Events & Scheduling");
    console.log("   ✅ Appointments Booking");
    console.log("   ✅ HR Employee Records");
    console.log("   ✅ Welfare Case Management");
    console.log("   ✅ Document Management");
    console.log("   ✅ System Audit Logs");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔐 Default Admin Login:");
    console.log("   Email: admin@tsoam.org");
    console.log("   Password: admin123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    process.exit(1);
  }
}

// Run initialization
if (require.main === module) {
  initializeCompleteDatabase();
}

module.exports = { initializeCompleteDatabase };
