#!/usr/bin/env node

/**
 * Complete Database Initialization Script for TSOAM Church Management System
 * Creates all tables and ensures proper data setup for production use
 */

const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
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

/**
 * Create all required tables for the TSOAM system
 */
async function createAllTables(connection) {
  console.log("📦 Creating all required database tables...");

  const tables = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('Admin', 'HR Officer', 'Finance Officer', 'User') NOT NULL DEFAULT 'User',
      department VARCHAR(100),
      employee_id VARCHAR(50),
      phone VARCHAR(20),
      is_active BOOLEAN DEFAULT TRUE,
      can_create_accounts BOOLEAN DEFAULT FALSE,
      can_delete_accounts BOOLEAN DEFAULT FALSE,
      profile_picture VARCHAR(500),
      address TEXT,
      emergency_contact_name VARCHAR(255),
      emergency_contact_phone VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      last_login TIMESTAMP NULL,

      INDEX idx_email (email),
      INDEX idx_role (role),
      INDEX idx_active (is_active),
      INDEX idx_employee_id (employee_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // User Requests table for account creation requests
    `CREATE TABLE IF NOT EXISTS user_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_id VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      role ENUM('Admin', 'HR Officer', 'Finance Officer', 'User') NOT NULL DEFAULT 'User',
      department VARCHAR(100),
      employee_id VARCHAR(50),
      requested_by VARCHAR(255),
      ip_address VARCHAR(45),
      request_reason TEXT,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      approved_by VARCHAR(36),
      approved_at TIMESTAMP NULL,
      rejection_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_status (status),
      INDEX idx_email (email),
      INDEX idx_requested_by (requested_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Password Reset table
    `CREATE TABLE IF NOT EXISTS password_resets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      email VARCHAR(255) NOT NULL,
      reset_code VARCHAR(6) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      used BOOLEAN DEFAULT FALSE,
      ip_address VARCHAR(45),
      user_agent TEXT,

      INDEX idx_email (email),
      INDEX idx_reset_code (reset_code),
      INDEX idx_expires_at (expires_at),
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Members table
    `CREATE TABLE IF NOT EXISTS members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      member_id VARCHAR(50) UNIQUE NOT NULL,
      tithe_number VARCHAR(50) UNIQUE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(20),
      address TEXT,
      date_of_birth DATE,
      gender ENUM('Male', 'Female'),
      marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed'),
      occupation VARCHAR(255),
      employment_status ENUM('Employed', 'Jobless', 'Business Class'),
      status ENUM('Active', 'Inactive', 'Suspended', 'Excommunicated') DEFAULT 'Active',
      join_date DATE,
      membership_date DATE,
      baptized BOOLEAN DEFAULT FALSE,
      baptism_date DATE,
      bible_study_completed BOOLEAN DEFAULT FALSE,
      bible_study_completion_date DATE,
      service_groups JSON,
      previous_church_name VARCHAR(255),
      reason_for_leaving_previous_church ENUM('Suspension', 'Termination', 'Self-Evolution', 'Relocation', 'Other'),
      reason_details TEXT,
      how_heard_about_us VARCHAR(100),
      born_again BOOLEAN DEFAULT FALSE,
      church_feedback TEXT,
      prayer_requests TEXT,
      emergency_contact_name VARCHAR(255),
      emergency_contact_phone VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_member_id (member_id),
      INDEX idx_tithe_number (tithe_number),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // New Members table
    `CREATE TABLE IF NOT EXISTS new_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      visitor_id VARCHAR(50) UNIQUE NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      phone_number VARCHAR(20) NOT NULL,
      email VARCHAR(255),
      date_of_birth DATE,
      gender ENUM('Male', 'Female') NOT NULL,
      marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed'),
      address TEXT,
      emergency_contact_name VARCHAR(255),
      emergency_contact_phone VARCHAR(20),
      visit_date DATE NOT NULL,
      baptized BOOLEAN DEFAULT FALSE,
      baptism_date DATE,
      bible_study_completed BOOLEAN DEFAULT FALSE,
      bible_study_completion_date DATE,
      employment_status ENUM('Employed', 'Jobless', 'Business Class'),
      previous_church_name VARCHAR(255),
      reason_for_leaving_previous_church ENUM('Suspension', 'Termination', 'Self-Evolution', 'Relocation', 'Other'),
      reason_details TEXT,
      how_heard_about_us VARCHAR(100),
      purpose_of_visit TEXT,
      born_again BOOLEAN DEFAULT FALSE,
      eligibility_for_transfer BOOLEAN DEFAULT FALSE,
      transferred_to_member BOOLEAN DEFAULT FALSE,
      transferred_date DATE NULL,
      status ENUM('Active', 'Transferred', 'Inactive') DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_visitor_id (visitor_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Employees table
    `CREATE TABLE IF NOT EXISTS employees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE,
      phone VARCHAR(20),
      position VARCHAR(255),
      department VARCHAR(100),
      employment_type ENUM('Full-time', 'Part-time', 'Volunteer', 'Contract', 'Intern'),
      hire_date DATE,
      contract_end_date DATE,
      basic_salary DECIMAL(12,2),
      housing_allowance DECIMAL(12,2) DEFAULT 0,
      transport_allowance DECIMAL(12,2) DEFAULT 0,
      medical_allowance DECIMAL(12,2) DEFAULT 0,
      other_allowances DECIMAL(12,2) DEFAULT 0,
      gender ENUM('Male', 'Female'),
      date_of_birth DATE,
      national_id VARCHAR(20),
      kra_pin VARCHAR(20),
      nssf_number VARCHAR(20),
      nhif_number VARCHAR(20),
      bank_name VARCHAR(255),
      bank_account VARCHAR(50),
      bank_branch VARCHAR(100),
      status ENUM('Active', 'Suspended', 'Terminated', 'On Leave', 'Probation') DEFAULT 'Active',
      supervisor_id INT,
      emergency_contact_name VARCHAR(255),
      emergency_contact_phone VARCHAR(20),
      emergency_contact_relationship VARCHAR(100),
      address TEXT,
      education_level VARCHAR(100),
      qualifications TEXT,
      skills TEXT,
      performance_rating DECIMAL(3,2) DEFAULT 0,
      last_review_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_employee_id (employee_id),
      INDEX idx_status (status),
      INDEX idx_department (department)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Financial Transactions table
    `CREATE TABLE IF NOT EXISTS financial_transactions (
      id VARCHAR(50) PRIMARY KEY,
      transaction_id VARCHAR(50) UNIQUE NOT NULL,
      type ENUM('Income', 'Expense', 'Investment', 'Transfer') NOT NULL,
      category VARCHAR(100) NOT NULL,
      subcategory VARCHAR(100),
      description TEXT NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'KSH',
      payment_method VARCHAR(50),
      reference_number VARCHAR(100),
      member_id INT,
      account_code VARCHAR(20),
      department VARCHAR(100),
      supplier_vendor VARCHAR(255),
      receipt_number VARCHAR(100),
      date DATE NOT NULL,
      due_date DATE,
      status ENUM('Pending', 'Completed', 'Cancelled', 'Approved', 'Rejected') DEFAULT 'Pending',
      approved_by VARCHAR(36),
      approved_date DATE,
      notes TEXT,
      vat_amount DECIMAL(12,2) DEFAULT 0,
      vat_rate DECIMAL(5,2) DEFAULT 0,
      created_by VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_type_date (type, date),
      INDEX idx_category (category),
      INDEX idx_status (status),
      INDEX idx_member (member_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Tithe Records table
    `CREATE TABLE IF NOT EXISTS tithe_records (
      id VARCHAR(50) PRIMARY KEY,
      tithe_number VARCHAR(50) UNIQUE NOT NULL,
      member_id INT NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      payment_method ENUM('Cash', 'Mobile Money', 'Bank Transfer', 'Cheque', 'Card') NOT NULL,
      payment_reference VARCHAR(100),
      tithe_date DATE NOT NULL,
      category ENUM('Tithe', 'Offering', 'Building Fund', 'Mission', 'Welfare', 'First Fruit') DEFAULT 'Tithe',
      received_by VARCHAR(255),
      receipt_issued BOOLEAN DEFAULT FALSE,
      receipt_number VARCHAR(100),
      notes TEXT,
      financial_year INT,
      quarter INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      INDEX idx_member_date (member_id, tithe_date),
      INDEX idx_category (category),
      INDEX idx_financial_year (financial_year)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Events table
    `CREATE TABLE IF NOT EXISTS events (
      id VARCHAR(50) PRIMARY KEY,
      event_id VARCHAR(50) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      event_type VARCHAR(100) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      start_time TIME,
      end_time TIME,
      location VARCHAR(255),
      venue_capacity INT,
      organizer_id VARCHAR(36),
      organizer_name VARCHAR(255),
      registration_required BOOLEAN DEFAULT FALSE,
      registration_deadline DATE,
      budget DECIMAL(12,2) DEFAULT 0,
      actual_cost DECIMAL(12,2) DEFAULT 0,
      expected_attendance INT,
      actual_attendance INT DEFAULT 0,
      status ENUM('Planning', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Postponed') DEFAULT 'Planning',
      priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
      public_event BOOLEAN DEFAULT TRUE,
      registration_fee DECIMAL(10,2) DEFAULT 0,
      special_requirements TEXT,
      contact_person VARCHAR(255),
      contact_phone VARCHAR(20),
      contact_email VARCHAR(255),
      created_by VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_start_date (start_date),
      INDEX idx_event_type (event_type),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Appointments table
    `CREATE TABLE IF NOT EXISTS appointments (
      id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      time TIME NOT NULL,
      duration_minutes INT DEFAULT 60,
      priority ENUM('urgent', 'high', 'medium', 'low') DEFAULT 'medium',
      status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'no_show') DEFAULT 'scheduled',
      type VARCHAR(100) NOT NULL,
      organizer_id VARCHAR(36) NOT NULL,
      organizer_name VARCHAR(255) NOT NULL,
      organizer_email VARCHAR(255),
      location_type ENUM('physical', 'virtual') DEFAULT 'physical',
      location_address TEXT,
      location_room VARCHAR(100),
      meeting_link VARCHAR(500),
      location_instructions TEXT,
      agenda TEXT,
      notes TEXT,
      created_by VARCHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_date_time (date, time),
      INDEX idx_status (status),
      INDEX idx_organizer (organizer_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Welfare Requests table
    `CREATE TABLE IF NOT EXISTS welfare_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_id VARCHAR(50) UNIQUE NOT NULL,
      applicant_name VARCHAR(255) NOT NULL,
      applicant_age INT,
      phone_number VARCHAR(20) NOT NULL,
      email_address VARCHAR(255),
      residence VARCHAR(255) NOT NULL,
      city_state_zip VARCHAR(255) NOT NULL,
      marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed'),
      dependents INT DEFAULT 0,
      member_id INT,
      membership_status ENUM('Active Member', 'Inactive Member', 'Non-Member') NOT NULL,
      membership_length VARCHAR(100),
      service_group VARCHAR(100),
      service_group_status ENUM('Active', 'Inactive', 'Leadership'),
      tithe_status ENUM('Faithful Tither', 'Inconsistent Tither', 'Non-Tither') NOT NULL,
      attendance_record JSON,
      employment_status VARCHAR(100) NOT NULL,
      monthly_income DECIMAL(12,2) NOT NULL,
      government_assistance ENUM('Yes', 'No'),
      other_income_sources VARCHAR(255),
      financial_hardship TEXT NOT NULL,
      assistance_type VARCHAR(100) NOT NULL,
      amount_requested DECIMAL(12,2) NOT NULL,
      reason_for_request TEXT NOT NULL,
      urgency_level ENUM('Low', 'Medium', 'High', 'Emergency') DEFAULT 'Medium',
      status ENUM('Pending', 'Under Review', 'Approved', 'Denied', 'Completed', 'Cancelled') DEFAULT 'Pending',
      reviewed_by VARCHAR(36),
      review_date DATE,
      review_notes TEXT,
      amount_approved DECIMAL(12,2),
      disbursement_date DATE,
      disbursement_method VARCHAR(100),
      follow_up_required BOOLEAN DEFAULT FALSE,
      follow_up_date DATE,
      application_date DATE NOT NULL,
      applicant_signature VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_status (status),
      INDEX idx_assistance_type (assistance_type),
      INDEX idx_member (member_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Inventory Items table
    `CREATE TABLE IF NOT EXISTS inventory_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      item_code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      subcategory VARCHAR(100),
      description TEXT,
      quantity INT NOT NULL DEFAULT 0,
      unit_cost DECIMAL(12,2) NOT NULL,
      reorder_level INT DEFAULT 0,
      max_stock_level INT,
      supplier VARCHAR(255),
      supplier_contact VARCHAR(100),
      location VARCHAR(100) NOT NULL,
      storage_conditions VARCHAR(255),
      status ENUM('Active', 'Inactive', 'Faulty', 'Under Maintenance', 'Disposed') DEFAULT 'Active',
      condition_rating ENUM('Excellent', 'Good', 'Fair', 'Poor') DEFAULT 'Good',
      purchase_date DATE,
      warranty_start_date DATE,
      warranty_end_date DATE,
      depreciation_rate DECIMAL(5,2) DEFAULT 0,
      current_value DECIMAL(12,2),
      last_maintenance_date DATE,
      next_maintenance_date DATE,
      maintenance_frequency_months INT,
      responsible_person VARCHAR(255),
      barcode VARCHAR(100),
      serial_number VARCHAR(100),
      model_number VARCHAR(100),
      manufacturer VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_item_code (item_code),
      INDEX idx_category (category),
      INDEX idx_status (status),
      INDEX idx_location (location)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Messages table
    `CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(50) PRIMARY KEY,
      message_id VARCHAR(50) UNIQUE NOT NULL,
      sender_id VARCHAR(36) NOT NULL,
      sender_name VARCHAR(255) NOT NULL,
      recipient_type ENUM('Individual', 'Group', 'Department', 'Role', 'All') NOT NULL,
      recipient_ids JSON,
      recipient_count INT DEFAULT 0,
      subject VARCHAR(255) NOT NULL,
      message_content TEXT NOT NULL,
      message_type ENUM('Email', 'SMS', 'In-App', 'Push') NOT NULL,
      priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
      status ENUM('Draft', 'Queued', 'Sending', 'Sent', 'Failed', 'Cancelled') DEFAULT 'Draft',
      scheduled_send_time TIMESTAMP NULL,
      sent_at TIMESTAMP NULL,
      delivery_report JSON,
      success_count INT DEFAULT 0,
      failed_count INT DEFAULT 0,
      template_id VARCHAR(50),
      attachments JSON,
      read_receipt_requested BOOLEAN DEFAULT FALSE,
      expires_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_sender_date (sender_id, created_at),
      INDEX idx_status (status),
      INDEX idx_message_type (message_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // System Logs table
    `CREATE TABLE IF NOT EXISTS system_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      log_id VARCHAR(50) UNIQUE NOT NULL,
      user_id VARCHAR(36),
      session_id VARCHAR(100),
      action VARCHAR(255) NOT NULL,
      module VARCHAR(100) NOT NULL,
      entity_type VARCHAR(100),
      entity_id VARCHAR(50),
      details TEXT,
      old_values JSON,
      new_values JSON,
      ip_address VARCHAR(45),
      user_agent TEXT,
      severity ENUM('Info', 'Warning', 'Error', 'Critical') DEFAULT 'Info',
      status ENUM('Success', 'Failed', 'Partial') DEFAULT 'Success',
      execution_time_ms INT,
      memory_usage_mb DECIMAL(8,2),
      request_method VARCHAR(10),
      request_url VARCHAR(500),
      response_code INT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      INDEX idx_user_action (user_id, action),
      INDEX idx_module_timestamp (module, timestamp),
      INDEX idx_severity (severity),
      INDEX idx_entity (entity_type, entity_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // System Settings table
    `CREATE TABLE IF NOT EXISTS system_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      setting_key VARCHAR(100) UNIQUE NOT NULL,
      setting_value TEXT,
      setting_type ENUM('string', 'number', 'boolean', 'json', 'encrypted') DEFAULT 'string',
      category VARCHAR(50),
      description TEXT,
      is_public BOOLEAN DEFAULT FALSE,
      is_system BOOLEAN DEFAULT FALSE,
      validation_rules JSON,
      default_value TEXT,
      min_value DECIMAL(15,2),
      max_value DECIMAL(15,2),
      allowed_values JSON,
      requires_restart BOOLEAN DEFAULT FALSE,
      updated_by VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_category (category),
      INDEX idx_is_public (is_public)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // User Sessions table
    `CREATE TABLE IF NOT EXISTS user_sessions (
      id VARCHAR(100) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      device_info JSON,
      location_info JSON,

      INDEX idx_user_active (user_id, is_active),
      INDEX idx_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Leave Types table (required for HR module)
    `CREATE TABLE IF NOT EXISTS leave_types (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(10) UNIQUE NOT NULL,
      default_days INT NOT NULL,
      max_days_per_year INT NOT NULL,
      carry_over_allowed BOOLEAN DEFAULT FALSE,
      max_carry_over_days INT DEFAULT 0,
      requires_approval BOOLEAN DEFAULT TRUE,
      requires_documentation BOOLEAN DEFAULT FALSE,
      is_paid BOOLEAN DEFAULT TRUE,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      category ENUM('statutory', 'company', 'special') DEFAULT 'company',
      accrual_rate DECIMAL(4,2),
      min_tenure_months INT DEFAULT 0,
      employment_types JSON,
      gender_restrictions ENUM('male', 'female', 'none') DEFAULT 'none',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Leave Requests table
    `CREATE TABLE IF NOT EXISTS leave_requests (
      id VARCHAR(50) PRIMARY KEY,
      employee_id INT NOT NULL,
      leave_type_id VARCHAR(50) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      resumption_date DATE NOT NULL,
      total_days INT NOT NULL,
      working_days INT NOT NULL,
      reason TEXT NOT NULL,
      status ENUM('draft', 'submitted', 'approved', 'rejected', 'cancelled', 'completed') DEFAULT 'draft',
      priority ENUM('normal', 'urgent', 'emergency') DEFAULT 'normal',
      applied_date DATE,
      submitted_date DATE,
      current_approval_level INT DEFAULT 1,
      handover_notes TEXT,
      covering_employee_id INT,
      covering_approved BOOLEAN DEFAULT FALSE,
      emergency_contact_name VARCHAR(255),
      emergency_contact_phone VARCHAR(20),
      emergency_contact_relationship VARCHAR(100),
      hr_notes TEXT,
      payroll_affected BOOLEAN DEFAULT FALSE,
      exit_interview_required BOOLEAN DEFAULT FALSE,
      created_by VARCHAR(36),
      updated_by VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_employee_status (employee_id, status),
      INDEX idx_dates (start_date, end_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Document Uploads table
    `CREATE TABLE IF NOT EXISTS document_uploads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      document_id VARCHAR(50) UNIQUE NOT NULL,
      entity_type ENUM('member', 'employee', 'welfare', 'finance', 'inventory', 'event', 'appointment', 'leave') NOT NULL,
      entity_id VARCHAR(50) NOT NULL,
      document_category VARCHAR(100),
      document_type VARCHAR(100),
      file_name VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size INT NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      file_hash VARCHAR(255),
      is_confidential BOOLEAN DEFAULT FALSE,
      access_level ENUM('Public', 'Internal', 'Restricted', 'Confidential') DEFAULT 'Internal',
      version INT DEFAULT 1,
      parent_document_id VARCHAR(50),
      uploaded_by VARCHAR(36) NOT NULL,
      verified_by VARCHAR(36),
      verification_date TIMESTAMP NULL,
      expiry_date DATE,
      tags JSON,
      notes TEXT,
      download_count INT DEFAULT 0,
      last_accessed TIMESTAMP NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_entity (entity_type, entity_id),
      INDEX idx_document_type (document_type),
      INDEX idx_uploaded_by (uploaded_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Notifications table
    `CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      notification_id VARCHAR(50) UNIQUE NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type ENUM('info', 'success', 'warning', 'error', 'reminder') DEFAULT 'info',
      category VARCHAR(100),
      priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
      status ENUM('Unread', 'Read', 'Dismissed', 'Archived') DEFAULT 'Unread',
      action_required BOOLEAN DEFAULT FALSE,
      action_url VARCHAR(500),
      action_text VARCHAR(100),
      related_entity_type VARCHAR(100),
      related_entity_id VARCHAR(50),
      scheduled_for TIMESTAMP NULL,
      read_at TIMESTAMP NULL,
      expires_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      INDEX idx_user_status (user_id, status),
      INDEX idx_type_priority (type, priority),
      INDEX idx_scheduled (scheduled_for)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  ];

  let tablesCreated = 0;
  for (const tableSQL of tables) {
    try {
      await connection.execute(tableSQL);
      tablesCreated++;
    } catch (error) {
      console.error(`❌ Error creating table: ${error.message}`);
    }
  }

  console.log(`✅ Created ${tablesCreated}/${tables.length} tables successfully`);
  return tablesCreated;
}

/**
 * Insert default users and system data
 */
async function insertDefaultData(connection) {
  console.log("📝 Inserting default system data...");

  // Create admin user with proper UUID
  const adminUserId = 'admin-001';
  const hashedPassword = await bcrypt.hash('admin123', 10);

  try {
    await connection.execute(
      `INSERT IGNORE INTO users (id, name, email, password_hash, role, is_active, can_create_accounts, can_delete_accounts)
       VALUES (?, 'System Administrator', 'admin@tsoam.org', ?, 'Admin', TRUE, TRUE, TRUE)`,
      [adminUserId, hashedPassword]
    );

    // Create additional test users
    const hrPassword = await bcrypt.hash('hr123', 10);
    const financePassword = await bcrypt.hash('finance123', 10);

    await connection.execute(
      `INSERT IGNORE INTO users (id, name, email, password_hash, role, is_active, can_create_accounts)
       VALUES ('hr-001', 'HR Manager', 'hr@tsoam.org', ?, 'HR Officer', TRUE, TRUE)`,
      [hrPassword]
    );

    await connection.execute(
      `INSERT IGNORE INTO users (id, name, email, password_hash, role, is_active)
       VALUES ('finance-001', 'Finance Manager', 'finance@tsoam.org', ?, 'Finance Officer', TRUE)`,
      [financePassword]
    );

    console.log("✅ Default users created");

    // Insert default system settings
    const defaultSettings = [
      ['church_name', 'The Seed of Abraham Ministry (TSOAM)', 'string', 'general', 'Official church name'],
      ['church_address', 'Nairobi, Kenya', 'string', 'general', 'Church physical address'],
      ['church_phone', '+254 700 000 000', 'string', 'general', 'Church contact phone'],
      ['church_email', 'admin@tsoam.org', 'string', 'general', 'Church contact email'],
      ['currency', 'KSH', 'string', 'finance', 'Default currency'],
      ['timezone', 'Africa/Nairobi', 'string', 'general', 'Default timezone'],
      ['backup_frequency', 'daily', 'string', 'system', 'Automatic backup frequency'],
      ['max_login_attempts', '5', 'number', 'security', 'Maximum login attempts before lockout'],
      ['session_timeout_minutes', '60', 'number', 'security', 'Session timeout in minutes'],
      ['file_upload_max_size', '10485760', 'number', 'system', 'Maximum file upload size in bytes (10MB)']
    ];

    for (const [key, value, type, category, description] of defaultSettings) {
      await connection.execute(
        `INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, category, description, is_public)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [key, value, type, category, description]
      );
    }

    console.log("✅ Default system settings created");

    // Insert default leave types (required for HR module)
    const defaultLeaveTypes = [
      ['annual', 'Annual Leave', 'AL', 21, 30, true, 5, true, false, true, 'Standard annual vacation leave', 'statutory', 1.75, 0, '["Full-time", "Part-time"]', 'none'],
      ['sick', 'Sick Leave', 'SL', 30, 60, false, 0, true, true, true, 'Medical leave for illness or injury', 'statutory', 0, 0, '["Full-time", "Part-time", "Volunteer"]', 'none'],
      ['maternity', 'Maternity Leave', 'ML', 90, 120, false, 0, true, true, true, 'Maternity leave for childbirth', 'statutory', 0, 12, '["Full-time", "Part-time"]', 'female'],
      ['paternity', 'Paternity Leave', 'PL', 14, 14, false, 0, true, true, true, 'Paternity leave for new fathers', 'statutory', 0, 12, '["Full-time", "Part-time"]', 'male'],
      ['emergency', 'Emergency Leave', 'EL', 5, 10, false, 0, true, true, false, 'Emergency or compassionate leave', 'company', 0, 3, '["Full-time", "Part-time"]', 'none'],
      ['study', 'Study Leave', 'STL', 30, 60, false, 0, true, true, false, 'Leave for educational purposes', 'company', 0, 24, '["Full-time"]', 'none']
    ];

    for (const [id, name, code, defaultDays, maxDays, carryOver, maxCarryOver, requiresApproval, requiresDocs, isPaid, description, category, accrualRate, minTenure, employmentTypes, genderRestrictions] of defaultLeaveTypes) {
      await connection.execute(
        `INSERT IGNORE INTO leave_types (id, name, code, default_days, max_days_per_year, carry_over_allowed, max_carry_over_days, requires_approval, requires_documentation, is_paid, description, category, accrual_rate, min_tenure_months, employment_types, gender_restrictions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, code, defaultDays, maxDays, carryOver, maxCarryOver, requiresApproval, requiresDocs, isPaid, description, category, accrualRate, minTenure, employmentTypes, genderRestrictions]
      );
    }

    console.log("✅ Default leave types created");

    // Create sample member for testing
    await connection.execute(
      `INSERT IGNORE INTO members (member_id, tithe_number, name, email, phone, status, join_date, membership_date, gender)
       VALUES ('MEM-001', 'TITHE-001', 'John Doe', 'john.doe@example.com', '+254700000001', 'Active', CURRENT_DATE, CURRENT_DATE, 'Male')`,
    );

    // Create sample employee for testing
    await connection.execute(
      `INSERT IGNORE INTO employees (employee_id, name, email, phone, position, department, employment_type, hire_date, status, basic_salary)
       VALUES ('EMP-001', 'Jane Smith', 'jane.smith@tsoam.org', '+254700000002', 'HR Manager', 'Human Resources', 'Full-time', CURRENT_DATE, 'Active', 50000.00)`,
    );

    // Create sample financial transaction for testing
    const transactionId = `TXN-${Date.now()}`;
    await connection.execute(
      `INSERT IGNORE INTO financial_transactions (id, transaction_id, type, category, description, amount, date, status)
       VALUES (?, ?, 'Income', 'Tithe', 'Sample tithe payment', 1000.00, CURRENT_DATE, 'Completed')`,
      [transactionId, transactionId]
    );

    // Create sample tithe record for testing
    const titheId = `TITHE-${Date.now()}`;
    await connection.execute(
      `INSERT IGNORE INTO tithe_records (id, tithe_number, member_id, amount, payment_method, tithe_date, category)
       VALUES (?, 'TITHE-001', 1, 500.00, 'Cash', CURRENT_DATE, 'Tithe')`,
      [titheId]
    );

    console.log("✅ Sample data created for testing");

    // Create performance indexes (MySQL compatible)
    console.log("📊 Creating performance indexes...");

    const indexes = [
      'CREATE INDEX idx_users_role_active ON users(role, is_active)',
      'CREATE INDEX idx_transactions_date_type ON financial_transactions(date, type)',
      'CREATE INDEX idx_members_active_status ON members(status)',
      'CREATE INDEX idx_logs_timestamp_severity ON system_logs(timestamp, severity)',
      'CREATE INDEX idx_appointments_date_status ON appointments(date, status)',
      'CREATE INDEX idx_events_start_date_status ON events(start_date, status)',
      'CREATE INDEX idx_inventory_category_status ON inventory_items(category, status)',
      'CREATE INDEX idx_leave_requests_employee_status ON leave_requests(employee_id, status)',
      'CREATE INDEX idx_messages_sender_date ON messages(sender_id, created_at)',
      'CREATE INDEX idx_notifications_user_status ON notifications(user_id, status)'
    ];

    let indexesCreated = 0;
    for (const indexSQL of indexes) {
      try {
        await connection.execute(indexSQL);
        indexesCreated++;
      } catch (error) {
        // Index might already exist, that's okay
        if (!error.message.includes('Duplicate key name')) {
          console.warn(`Index creation warning: ${error.message}`);
        }
      }
    }

    console.log(`✅ Created ${indexesCreated} performance indexes`);

  } catch (error) {
    console.error(`❌ Error inserting default data: ${error.message}`);
  }
}

/**
 * Main function to initialize the complete database
 */
async function initializeCompleteDatabase() {
  console.log("🚀 TSOAM Church Management System - Complete Database Initialization");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  let connection;

  try {
    console.log("🔗 Connecting to MySQL server...");

    // First connect without database to create it
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true
    });

    console.log("✅ MySQL server connection successful");

    // Create database if it doesn't exist
    console.log(`🏗️  Creating database '${dbConfig.database}'...`);
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );

    await connection.execute(`USE ${dbConfig.database}`);
    console.log(`✅ Database '${dbConfig.database}' ready`);

    // Create all tables
    const tablesCreated = await createAllTables(connection);

    // Insert default data
    await insertDefaultData(connection);

    // Verify tables were created
    const [tables] = await connection.execute("SHOW TABLES");
    console.log(`📊 Database verification: ${tables.length} tables created`);

    // List all tables
    console.log("📋 Tables created:");
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`   ${index + 1}. ${tableName}`);
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Database initialization completed successfully!");
    console.log("🔐 Default login credentials:");
    console.log("   Admin: admin@tsoam.org / admin123");
    console.log("   HR: hr@tsoam.org / hr123");
    console.log("   Finance: finance@tsoam.org / finance123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    console.error("💡 Please ensure:");
    console.error("   1. MySQL server is running");
    console.error("   2. Database credentials are correct in .env file");
    console.error("   3. User has CREATE DATABASE privileges");
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the initialization if this file is executed directly
if (require.main === module) {
  initializeCompleteDatabase();
}

module.exports = { initializeCompleteDatabase };
