-- =====================================================
-- TSOAM Church Management System - Essential Database Schema
-- MySQL 8.0+ Compatible - Simplified Version
-- =====================================================

CREATE DATABASE IF NOT EXISTS tsoam_church_db 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE tsoam_church_db;

-- =====================================================
-- CORE TABLES (Essential for basic functionality)
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin', 'HR Officer', 'Finance Officer', 'User') NOT NULL DEFAULT 'User',
  department VARCHAR(100),
  employee_id VARCHAR(50) UNIQUE,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  can_create_accounts BOOLEAN DEFAULT FALSE,
  can_delete_accounts BOOLEAN DEFAULT FALSE,
  profile_picture VARCHAR(500),
  address TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  last_login TIMESTAMP NULL,
  failed_login_attempts INT DEFAULT 0,
  account_locked_until TIMESTAMP NULL,
  password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_active (is_active),
  INDEX idx_employee_id (employee_id),
  INDEX idx_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Requests table
CREATE TABLE IF NOT EXISTS user_requests (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password Reset table
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  reset_code VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_reset_code (reset_code),
  INDEX idx_expires_at (expires_at),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Members table
CREATE TABLE IF NOT EXISTS members (
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
  photo_url VARCHAR(500),
  notes TEXT,
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_member_id (member_id),
  INDEX idx_tithe_number (tithe_number),
  INDEX idx_status (status),
  INDEX idx_name (name),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- New Members table
CREATE TABLE IF NOT EXISTS new_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  visitor_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  date_of_birth DATE,
  gender ENUM('Male', 'Female') NOT NULL,
  marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed'),
  address TEXT,
  occupation VARCHAR(255),
  how_heard_about_church VARCHAR(100),
  previous_church VARCHAR(255),
  born_again BOOLEAN DEFAULT FALSE,
  wants_baptism BOOLEAN DEFAULT FALSE,
  wants_bible_study BOOLEAN DEFAULT FALSE,
  prayer_requests TEXT,
  follow_up_needed BOOLEAN DEFAULT TRUE,
  follow_up_date DATE,
  status ENUM('New', 'Following Up', 'Joined', 'Not Interested') DEFAULT 'New',
  visited_date DATE DEFAULT (CURRENT_DATE),
  notes TEXT,
  assigned_to VARCHAR(36),
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_visitor_id (visitor_id),
  INDEX idx_status (status),
  INDEX idx_follow_up (follow_up_needed, follow_up_date),
  INDEX idx_assigned_to (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  user_id VARCHAR(36),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  date_of_birth DATE,
  gender ENUM('Male', 'Female'),
  marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed'),
  department VARCHAR(100),
  position VARCHAR(100),
  employment_type ENUM('Full-time', 'Part-time', 'Contract', 'Volunteer') DEFAULT 'Full-time',
  employment_status ENUM('Active', 'Inactive', 'Terminated', 'Suspended') DEFAULT 'Active',
  hire_date DATE,
  termination_date DATE,
  salary DECIMAL(12,2),
  bank_account VARCHAR(50),
  tax_number VARCHAR(50),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  skills TEXT,
  qualifications TEXT,
  notes TEXT,
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_employee_id (employee_id),
  INDEX idx_department (department),
  INDEX idx_status (employment_status),
  INDEX idx_employment_type (employment_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Financial Transactions table
CREATE TABLE IF NOT EXISTS financial_transactions (
  id VARCHAR(50) PRIMARY KEY,
  transaction_id VARCHAR(50) UNIQUE NOT NULL,
  type ENUM('Income', 'Expense') NOT NULL,
  category VARCHAR(100) NOT NULL,
  sub_category VARCHAR(100),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  reference_number VARCHAR(100),
  payment_method ENUM('Cash', 'Bank Transfer', 'Cheque', 'Mobile Money', 'Card') DEFAULT 'Cash',
  bank_account VARCHAR(100),
  cheque_number VARCHAR(50),
  transaction_date DATE NOT NULL,
  recorded_date DATE DEFAULT (CURRENT_DATE),
  status ENUM('Pending', 'Completed', 'Cancelled', 'Failed') DEFAULT 'Completed',
  approval_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Approved',
  approved_by VARCHAR(36),
  approved_date DATE,
  member_id INT,
  employee_id INT,
  project_code VARCHAR(50),
  tax_applicable BOOLEAN DEFAULT FALSE,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  receipt_number VARCHAR(100),
  attachments JSON,
  notes TEXT,
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_transaction_id (transaction_id),
  INDEX idx_type_category (type, category),
  INDEX idx_transaction_date (transaction_date),
  INDEX idx_status (status),
  INDEX idx_member_id (member_id),
  INDEX idx_reference_number (reference_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(50) PRIMARY KEY,
  event_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type ENUM('Service', 'Meeting', 'Conference', 'Workshop', 'Social', 'Outreach', 'Other') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  venue VARCHAR(255),
  capacity INT,
  registration_required BOOLEAN DEFAULT FALSE,
  registration_deadline DATE,
  registration_fee DECIMAL(10,2) DEFAULT 0,
  status ENUM('Planned', 'Active', 'Cancelled', 'Completed') DEFAULT 'Planned',
  visibility ENUM('Public', 'Members Only', 'Staff Only', 'Private') DEFAULT 'Public',
  organizer_id VARCHAR(36),
  coordinator_id VARCHAR(36),
  budget DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  attendee_count INT DEFAULT 0,
  feedback_summary TEXT,
  photos_url JSON,
  attachments JSON,
  notes TEXT,
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_event_id (event_id),
  INDEX idx_event_type (event_type),
  INDEX idx_start_date (start_date),
  INDEX idx_status (status),
  INDEX idx_organizer (organizer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(50) PRIMARY KEY,
  appointment_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  appointment_type ENUM('Counseling', 'Meeting', 'Prayer', 'Consultation', 'Follow-up', 'Other') NOT NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(255),
  member_id INT,
  staff_id VARCHAR(36) NOT NULL,
  status ENUM('Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No-show') DEFAULT 'Scheduled',
  priority ENUM('Low', 'Normal', 'High', 'Urgent') DEFAULT 'Normal',
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_date TIMESTAMP NULL,
  notes TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  outcome TEXT,
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_appointment_id (appointment_id),
  INDEX idx_appointment_date (appointment_date),
  INDEX idx_member_id (member_id),
  INDEX idx_staff_id (staff_id),
  INDEX idx_status (status),
  INDEX idx_reminder (reminder_sent, reminder_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory Items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id VARCHAR(50) PRIMARY KEY,
  item_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  sub_category VARCHAR(100),
  unit_of_measure VARCHAR(50) DEFAULT 'pcs',
  current_quantity INT NOT NULL DEFAULT 0,
  minimum_quantity INT DEFAULT 0,
  maximum_quantity INT,
  unit_cost DECIMAL(12,2),
  location VARCHAR(100),
  supplier VARCHAR(255),
  barcode VARCHAR(100),
  status ENUM('Active', 'Low Stock', 'Out of Stock', 'Discontinued') DEFAULT 'Active',
  last_restocked DATE,
  expiry_date DATE,
  notes TEXT,
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_item_code (item_code),
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_location (location),
  INDEX idx_supplier (supplier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Welfare Requests table
CREATE TABLE IF NOT EXISTS welfare_requests (
  id VARCHAR(50) PRIMARY KEY,
  request_id VARCHAR(50) UNIQUE NOT NULL,
  member_id INT NOT NULL,
  request_type ENUM('Financial', 'Medical', 'Educational', 'Emergency', 'Food', 'Clothing', 'Other') NOT NULL,
  amount_requested DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'KSH',
  reason TEXT NOT NULL,
  urgency ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
  status ENUM('Submitted', 'Under Review', 'Approved', 'Rejected', 'Disbursed', 'Completed') DEFAULT 'Submitted',
  request_date DATE DEFAULT (CURRENT_DATE),
  review_date DATE,
  decision_date DATE,
  disbursement_date DATE,
  reviewed_by VARCHAR(36),
  approved_by VARCHAR(36),
  reviewer_notes TEXT,
  approval_notes TEXT,
  amount_approved DECIMAL(12,2),
  amount_disbursed DECIMAL(12,2),
  disbursement_method ENUM('Cash', 'Bank Transfer', 'Cheque', 'Mobile Money', 'Direct Payment') DEFAULT 'Cash',
  reference_number VARCHAR(100),
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  follow_up_notes TEXT,
  attachments JSON,
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_request_id (request_id),
  INDEX idx_member_id (member_id),
  INDEX idx_request_type (request_type),
  INDEX idx_status (status),
  INDEX idx_urgency (urgency),
  INDEX idx_request_date (request_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
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
  INDEX idx_message_type (message_type),
  INDEX idx_scheduled_send (scheduled_send_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Logs table
CREATE TABLE IF NOT EXISTS system_logs (
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
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Settings table
CREATE TABLE IF NOT EXISTS system_settings (
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
  INDEX idx_is_public (is_public),
  INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Default system settings
INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('church_name', 'The Seed of Abraham Ministry (TSOAM)', 'string', 'general', 'Official church name', TRUE),
('church_address', 'Nairobi, Kenya', 'string', 'general', 'Church physical address', TRUE),
('church_phone', '+254 700 000 000', 'string', 'general', 'Church contact phone', TRUE),
('church_email', 'admin@tsoam.org', 'string', 'general', 'Church contact email', TRUE),
('currency', 'KSH', 'string', 'finance', 'Default currency', TRUE),
('timezone', 'Africa/Nairobi', 'string', 'general', 'Default timezone', TRUE),
('backup_frequency', 'daily', 'string', 'system', 'Automatic backup frequency', FALSE),
('max_login_attempts', '5', 'number', 'security', 'Maximum login attempts before lockout', FALSE),
('session_timeout_minutes', '60', 'number', 'security', 'Session timeout in minutes', FALSE),
('file_upload_max_size', '10485760', 'number', 'system', 'Maximum file upload size in bytes (10MB)', FALSE);

-- Create default admin user (password: admin123)
INSERT IGNORE INTO users (id, name, email, password_hash, role, is_active, can_create_accounts, can_delete_accounts, department, employee_id) VALUES
('admin-001', 'System Administrator', 'admin@tsoam.org', '$2a$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewDjCNVJ7q7Y.Fqe', 'Admin', TRUE, TRUE, TRUE, 'Administration', 'TSOAM-ADM-001');

-- Create additional default users  
INSERT IGNORE INTO users (id, name, email, password_hash, role, is_active, can_create_accounts, department, employee_id) VALUES
('hr-001', 'HR Manager', 'hr@tsoam.org', '$2a$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewDjCNVJ7q7Y.Fqe', 'HR Officer', TRUE, TRUE, 'Human Resources', 'TSOAM-HR-001'),
('finance-001', 'Finance Manager', 'finance@tsoam.org', '$2a$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewDjCNVJ7q7Y.Fqe', 'Finance Officer', TRUE, FALSE, 'Finance', 'TSOAM-FIN-001');

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT '✅ TSOAM Essential Database Schema Created Successfully!' as Status,
       '🔐 Default Admin: admin@tsoam.org / admin123' as Login,
       CONCAT('📊 Total Tables: ', COUNT(*)) as TableCount
FROM information_schema.tables 
WHERE table_schema = 'tsoam_church_db';
