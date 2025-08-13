#!/usr/bin/env node

/**
 * Complete Database Initialization for TSOAM Church Management System
 * Creates all required tables for full data persistence with MySQL compatibility
 */

const { query } = require("./config/database");
const bcrypt = require("bcrypt");

async function initializeCompleteDatabase() {
  console.log("🔄 Initializing complete TSOAM database schema...");
  
  try {
    // Create users table with enhanced fields (MySQL compatible)
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role ENUM('admin', 'pastor', 'hr', 'finance', 'user') DEFAULT 'user',
        password_hash TEXT NOT NULL,
        department VARCHAR(100),
        employee_id VARCHAR(50) UNIQUE,
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT 0,
        last_login DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Users table created/verified");

    // Create members table
    await query(`
      CREATE TABLE IF NOT EXISTS members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        date_of_birth DATE,
        membership_date DATE,
        status ENUM('active', 'inactive') DEFAULT 'active',
        service_group VARCHAR(100),
        emergency_contact VARCHAR(255),
        emergency_phone VARCHAR(20),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Members table created/verified");

    // Create messages table with replies support
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT,
        recipient_ids JSON,
        message_type ENUM('SMS', 'Email', 'Internal') DEFAULT 'Internal',
        subject VARCHAR(255),
        content TEXT NOT NULL,
        recipient_type ENUM('member', 'employee', 'group') DEFAULT 'employee',
        status ENUM('sent', 'delivered', 'failed', 'read') DEFAULT 'sent',
        parent_message_id INT NULL,
        is_reply BOOLEAN DEFAULT 0,
        read_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id),
        FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Messages table created/verified");

    // Create message_replies table for tracking conversation threads
    await query(`
      CREATE TABLE IF NOT EXISTS message_replies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_message_id INT NOT NULL,
        reply_message_id INT NOT NULL,
        thread_depth INT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (original_message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (reply_message_id) REFERENCES messages(id) ON DELETE CASCADE,
        UNIQUE KEY unique_reply (original_message_id, reply_message_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Message replies table created/verified");

    // Create inventory table
    await query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
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
        status ENUM('working', 'faulty', 'maintenance', 'missing', 'disposed') DEFAULT 'working',
        condition_status ENUM('excellent', 'good', 'fair', 'poor') DEFAULT 'good',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Inventory table created/verified");

    // Create financial_transactions table
    await query(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_type ENUM('income', 'expense') NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        account VARCHAR(100),
        reference_number VARCHAR(50),
        transaction_date DATE NOT NULL,
        created_by INT,
        approved_by INT,
        status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Financial transactions table created/verified");

    // Create events table
    await query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATETIME NOT NULL,
        end_date DATETIME,
        location VARCHAR(255),
        organizer VARCHAR(255),
        category VARCHAR(100),
        status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
        max_attendees INT,
        registration_required BOOLEAN DEFAULT 0,
        created_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Events table created/verified");

    // Create appointments table
    await query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        appointment_date DATETIME NOT NULL,
        duration INT DEFAULT 30,
        attendee_name VARCHAR(255),
        attendee_phone VARCHAR(20),
        attendee_email VARCHAR(255),
        status ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show') DEFAULT 'scheduled',
        type VARCHAR(100),
        created_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Appointments table created/verified");

    // Create system_logs table
    await query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(255) NOT NULL,
        module VARCHAR(100) NOT NULL,
        details TEXT,
        severity ENUM('Info', 'Warning', 'Error', 'Security') DEFAULT 'Info',
        user_id INT,
        ip_address VARCHAR(45),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ System logs table created/verified");

    // Create hr_employees table
    await query(`
      CREATE TABLE IF NOT EXISTS hr_employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        department VARCHAR(100),
        position VARCHAR(100),
        salary DECIMAL(10,2),
        hire_date DATE,
        status ENUM('active', 'inactive', 'terminated', 'on-leave') DEFAULT 'active',
        emergency_contact VARCHAR(255),
        emergency_phone VARCHAR(20),
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ HR employees table created/verified");

    // Create welfare_cases table
    await query(`
      CREATE TABLE IF NOT EXISTS welfare_cases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        case_number VARCHAR(50) UNIQUE NOT NULL,
        member_id INT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        status ENUM('open', 'in-progress', 'resolved', 'closed') DEFAULT 'open',
        amount_requested DECIMAL(10,2),
        amount_approved DECIMAL(10,2),
        created_by INT,
        assigned_to INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Welfare cases table created/verified");

    // Create documents table
    await query(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_path VARCHAR(500),
        file_type VARCHAR(50),
        file_size INT,
        category VARCHAR(100),
        uploaded_by INT,
        access_level ENUM('public', 'private', 'restricted') DEFAULT 'private',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Documents table created/verified");

    // Insert default admin user if no users exist
    const existingUsers = await query("SELECT COUNT(*) as count FROM users");
    if (existingUsers.success && existingUsers.data[0].count === 0) {
      console.log("👤 Creating default admin user...");
      
      const hashedPassword = await bcrypt.hash("admin123", 12);
      
      await query(
        `INSERT INTO users (name, email, role, password_hash, department, employee_id, is_active, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
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
    console.log("   ✅ Internal Messaging System with Replies");
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
