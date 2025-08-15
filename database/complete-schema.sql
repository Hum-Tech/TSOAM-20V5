-- =====================================================
-- TSOAM Church Management System - Complete Database Schema
-- Version: 2.0
-- MySQL 8.0+ Compatible
-- =====================================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS tsoam_church_db 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE tsoam_church_db;

-- =====================================================
-- 1. USER MANAGEMENT & AUTHENTICATION
-- =====================================================

-- Users table (System users with roles and permissions)
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

-- User Requests table (For account creation approval workflow)
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
  INDEX idx_requested_by (requested_by),
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
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
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
  INDEX idx_expires (expires_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. CHURCH MEMBER MANAGEMENT
-- =====================================================

-- Members table (Church members and congregation)
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
  INDEX idx_email (email),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- New Members table (Visitors and new member registration)
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
  INDEX idx_assigned_to (assigned_to),
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Member Families table (Family groupings)
CREATE TABLE IF NOT EXISTS member_families (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id VARCHAR(50) UNIQUE NOT NULL,
  family_name VARCHAR(255) NOT NULL,
  head_of_family_id INT,
  address TEXT,
  family_phone VARCHAR(20),
  family_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_family_id (family_id),
  INDEX idx_head_of_family (head_of_family_id),
  FOREIGN KEY (head_of_family_id) REFERENCES members(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Member Family Relationships table
CREATE TABLE IF NOT EXISTS member_family_relationships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  member_id INT NOT NULL,
  relationship ENUM('Head', 'Spouse', 'Child', 'Parent', 'Guardian', 'Other') NOT NULL,
  is_primary_contact BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_family_member (family_id, member_id),
  INDEX idx_family_id (family_id),
  INDEX idx_member_id (member_id),
  FOREIGN KEY (family_id) REFERENCES member_families(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. HUMAN RESOURCES & EMPLOYEE MANAGEMENT
-- =====================================================

-- Employees table (Church staff and employees)
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

  UNIQUE KEY unique_user (user_id),
  INDEX idx_employee_id (employee_id),
  INDEX idx_department (department),
  INDEX idx_status (employment_status),
  INDEX idx_employment_type (employment_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Types table
CREATE TABLE IF NOT EXISTS leave_types (
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_code (code),
  INDEX idx_active (is_active),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Requests table
CREATE TABLE IF NOT EXISTS leave_requests (
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
  INDEX idx_dates (start_date, end_date),
  INDEX idx_leave_type (leave_type_id),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT,
  FOREIGN KEY (covering_employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Performance Reviews table
CREATE TABLE IF NOT EXISTS performance_reviews (
  id VARCHAR(50) PRIMARY KEY,
  employee_id INT NOT NULL,
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  review_type ENUM('Annual', 'Mid-Year', 'Probation', 'Project', 'Exit') DEFAULT 'Annual',
  overall_rating ENUM('Outstanding', 'Exceeds Expectations', 'Meets Expectations', 'Below Expectations', 'Unsatisfactory'),
  strengths TEXT,
  areas_for_improvement TEXT,
  goals_achieved TEXT,
  goals_for_next_period TEXT,
  training_needs TEXT,
  career_development_discussion TEXT,
  employee_comments TEXT,
  reviewer_comments TEXT,
  status ENUM('Draft', 'In Progress', 'Employee Review', 'Completed', 'Archived') DEFAULT 'Draft',
  reviewed_by VARCHAR(36),
  reviewed_date DATE,
  employee_acknowledged BOOLEAN DEFAULT FALSE,
  employee_acknowledged_date DATE,
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_employee_id (employee_id),
  INDEX idx_review_period (review_period_start, review_period_end),
  INDEX idx_status (status),
  INDEX idx_reviewed_by (reviewed_by),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll table
CREATE TABLE IF NOT EXISTS payroll (
  id VARCHAR(50) PRIMARY KEY,
  employee_id INT NOT NULL,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  basic_salary DECIMAL(12,2) NOT NULL,
  allowances DECIMAL(12,2) DEFAULT 0,
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  overtime_amount DECIMAL(12,2) DEFAULT 0,
  bonus DECIMAL(12,2) DEFAULT 0,
  gross_pay DECIMAL(12,2) NOT NULL,
  tax_deduction DECIMAL(12,2) DEFAULT 0,
  nhif_deduction DECIMAL(12,2) DEFAULT 0,
  nssf_deduction DECIMAL(12,2) DEFAULT 0,
  other_deductions DECIMAL(12,2) DEFAULT 0,
  total_deductions DECIMAL(12,2) NOT NULL,
  net_pay DECIMAL(12,2) NOT NULL,
  status ENUM('Draft', 'Calculated', 'Approved', 'Paid') DEFAULT 'Draft',
  payment_method ENUM('Bank Transfer', 'Cheque', 'Cash', 'Mobile Money') DEFAULT 'Bank Transfer',
  payment_reference VARCHAR(100),
  paid_date DATE,
  notes TEXT,
  processed_by VARCHAR(36),
  approved_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_employee_period (employee_id, pay_period_start, pay_period_end),
  INDEX idx_status (status),
  INDEX idx_pay_period (pay_period_start, pay_period_end),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. FINANCIAL MANAGEMENT
-- =====================================================

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
  INDEX idx_reference_number (reference_number),
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Budget Categories table
CREATE TABLE IF NOT EXISTS budget_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) UNIQUE NOT NULL,
  category_type ENUM('Income', 'Expense') NOT NULL,
  parent_category_id INT,
  budget_year YEAR NOT NULL,
  budgeted_amount DECIMAL(15,2) NOT NULL,
  actual_amount DECIMAL(15,2) DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_category_type (category_type),
  INDEX idx_budget_year (budget_year),
  INDEX idx_parent_category (parent_category_id),
  FOREIGN KEY (parent_category_id) REFERENCES budget_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pledges table
CREATE TABLE IF NOT EXISTS pledges (
  id VARCHAR(50) PRIMARY KEY,
  pledge_id VARCHAR(50) UNIQUE NOT NULL,
  member_id INT NOT NULL,
  pledge_type ENUM('Tithe', 'Offering', 'Building Fund', 'Special Project', 'Other') NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  remaining_amount DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  start_date DATE NOT NULL,
  target_date DATE,
  payment_frequency ENUM('Weekly', 'Monthly', 'Quarterly', 'Annually', 'One-time') DEFAULT 'Monthly',
  status ENUM('Active', 'Completed', 'Cancelled', 'Overdue') DEFAULT 'Active',
  notes TEXT,
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_pledge_id (pledge_id),
  INDEX idx_member_id (member_id),
  INDEX idx_pledge_type (pledge_type),
  INDEX idx_status (status),
  INDEX idx_target_date (target_date),
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. EVENTS & APPOINTMENTS
-- =====================================================

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
  INDEX idx_organizer (organizer_id),
  FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (coordinator_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Event Registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id VARCHAR(50) NOT NULL,
  member_id INT,
  attendee_name VARCHAR(255) NOT NULL,
  attendee_email VARCHAR(255),
  attendee_phone VARCHAR(20),
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_status ENUM('Pending', 'Paid', 'Waived', 'Refunded') DEFAULT 'Pending',
  payment_amount DECIMAL(10,2),
  payment_method ENUM('Cash', 'Bank Transfer', 'Mobile Money', 'Card') DEFAULT 'Cash',
  attendance_status ENUM('Registered', 'Confirmed', 'Attended', 'No-show', 'Cancelled') DEFAULT 'Registered',
  special_requirements TEXT,
  notes TEXT,
  created_by VARCHAR(36),

  UNIQUE KEY unique_member_event (event_id, member_id),
  INDEX idx_event_id (event_id),
  INDEX idx_member_id (member_id),
  INDEX idx_registration_date (registration_date),
  INDEX idx_attendance_status (attendance_status),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
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
  INDEX idx_reminder (reminder_sent, reminder_date),
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. INVENTORY MANAGEMENT
-- =====================================================

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
  total_value DECIMAL(15,2) GENERATED ALWAYS AS (current_quantity * unit_cost) STORED,
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
  INDEX idx_supplier (supplier),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory Transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id VARCHAR(50) PRIMARY KEY,
  transaction_id VARCHAR(50) UNIQUE NOT NULL,
  item_id VARCHAR(50) NOT NULL,
  transaction_type ENUM('Purchase', 'Sale', 'Adjustment', 'Transfer', 'Damaged', 'Expired') NOT NULL,
  quantity INT NOT NULL,
  unit_cost DECIMAL(12,2),
  total_cost DECIMAL(15,2),
  reference_number VARCHAR(100),
  transaction_date DATE NOT NULL,
  location VARCHAR(100),
  supplier_customer VARCHAR(255),
  reason TEXT,
  approved_by VARCHAR(36),
  notes TEXT,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_transaction_id (transaction_id),
  INDEX idx_item_id (item_id),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_transaction_date (transaction_date),
  INDEX idx_reference_number (reference_number),
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. MESSAGING & COMMUNICATION
-- =====================================================

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
  INDEX idx_scheduled_send (scheduled_send_time),
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Message Replies table
CREATE TABLE IF NOT EXISTS message_replies (
  id VARCHAR(50) PRIMARY KEY,
  parent_message_id VARCHAR(50) NOT NULL,
  sender_id VARCHAR(36) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  reply_content TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  attachments JSON,

  INDEX idx_parent_message (parent_message_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_sent_at (sent_at),
  FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Message Recipients table
CREATE TABLE IF NOT EXISTS message_recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id VARCHAR(50) NOT NULL,
  recipient_id VARCHAR(36),
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  delivery_status ENUM('Pending', 'Delivered', 'Failed', 'Bounced') DEFAULT 'Pending',
  read_status BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  delivery_attempts INT DEFAULT 0,
  last_attempt_at TIMESTAMP NULL,
  error_message TEXT,

  INDEX idx_message_id (message_id),
  INDEX idx_recipient_id (recipient_id),
  INDEX idx_delivery_status (delivery_status),
  INDEX idx_read_status (read_status),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. WELFARE & ASSISTANCE MANAGEMENT
-- =====================================================

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
  INDEX idx_request_date (request_date),
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. DOCUMENT MANAGEMENT
-- =====================================================

-- Document Uploads table
CREATE TABLE IF NOT EXISTS document_uploads (
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
  INDEX idx_access_level (access_level),
  INDEX idx_uploaded_by (uploaded_by),
  INDEX idx_file_hash (file_hash),
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. SYSTEM ADMINISTRATION
-- =====================================================

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
  INDEX idx_timestamp (timestamp),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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
  INDEX idx_setting_key (setting_key),
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Permissions table (Role-based access control)
CREATE TABLE IF NOT EXISTS user_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  permission_name VARCHAR(100) NOT NULL,
  permission_value BOOLEAN DEFAULT TRUE,
  granted_by VARCHAR(36),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  notes TEXT,

  UNIQUE KEY unique_user_permission (user_id, permission_name),
  INDEX idx_user_id (user_id),
  INDEX idx_permission_name (permission_name),
  INDEX idx_expires_at (expires_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role Permissions table (Define what each role can do)
CREATE TABLE IF NOT EXISTS role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_name ENUM('Admin', 'HR Officer', 'Finance Officer', 'User') NOT NULL,
  permission_name VARCHAR(100) NOT NULL,
  permission_value BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_role_permission (role_name, permission_name),
  INDEX idx_role_name (role_name),
  INDEX idx_permission_name (permission_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 11. DATABASE USERS AND PRIVILEGES
-- =====================================================

-- Create dedicated database users with appropriate privileges
-- Note: These commands should be run by a MySQL administrator

-- Drop users if they exist (for clean setup)
-- DROP USER IF EXISTS 'tsoam_admin'@'localhost';
-- DROP USER IF EXISTS 'tsoam_app'@'localhost';
-- DROP USER IF EXISTS 'tsoam_readonly'@'localhost';

-- Create application users
CREATE USER IF NOT EXISTS 'tsoam_admin'@'localhost' IDENTIFIED BY 'TsoamAdmin2025!';
CREATE USER IF NOT EXISTS 'tsoam_app'@'localhost' IDENTIFIED BY 'TsoamApp2025!';
CREATE USER IF NOT EXISTS 'tsoam_readonly'@'localhost' IDENTIFIED BY 'TsoamRead2025!';

-- Grant privileges

-- Admin user (full access for maintenance and setup)
GRANT ALL PRIVILEGES ON tsoam_church_db.* TO 'tsoam_admin'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER ON tsoam_church_db.* TO 'tsoam_admin'@'localhost';

-- Application user (normal operations)
GRANT SELECT, INSERT, UPDATE, DELETE ON tsoam_church_db.* TO 'tsoam_app'@'localhost';
GRANT CREATE TEMPORARY TABLES ON tsoam_church_db.* TO 'tsoam_app'@'localhost';

-- Read-only user (for reporting and backups)
GRANT SELECT ON tsoam_church_db.* TO 'tsoam_readonly'@'localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- =====================================================
-- 12. INSERT DEFAULT DATA
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
('file_upload_max_size', '10485760', 'number', 'system', 'Maximum file upload size in bytes (10MB)', FALSE),
('password_min_length', '8', 'number', 'security', 'Minimum password length', FALSE),
('password_require_special_chars', 'true', 'boolean', 'security', 'Require special characters in passwords', FALSE),
('email_notifications_enabled', 'true', 'boolean', 'notifications', 'Enable email notifications', FALSE),
('sms_notifications_enabled', 'false', 'boolean', 'notifications', 'Enable SMS notifications', FALSE);

-- Default leave types
INSERT IGNORE INTO leave_types (id, name, code, default_days, max_days_per_year, carry_over_allowed, max_carry_over_days, requires_approval, requires_documentation, is_paid, description, category, accrual_rate, min_tenure_months, employment_types, gender_restrictions) VALUES
('annual', 'Annual Leave', 'AL', 21, 30, TRUE, 5, TRUE, FALSE, TRUE, 'Standard annual vacation leave', 'statutory', 1.75, 0, '["Full-time", "Part-time"]', 'none'),
('sick', 'Sick Leave', 'SL', 30, 60, FALSE, 0, TRUE, TRUE, TRUE, 'Medical leave for illness or injury', 'statutory', 0, 0, '["Full-time", "Part-time", "Volunteer"]', 'none'),
('maternity', 'Maternity Leave', 'ML', 90, 120, FALSE, 0, TRUE, TRUE, TRUE, 'Maternity leave for childbirth', 'statutory', 0, 12, '["Full-time", "Part-time"]', 'female'),
('paternity', 'Paternity Leave', 'PL', 14, 14, FALSE, 0, TRUE, TRUE, TRUE, 'Paternity leave for new fathers', 'statutory', 0, 12, '["Full-time", "Part-time"]', 'male'),
('emergency', 'Emergency Leave', 'EL', 5, 10, FALSE, 0, TRUE, TRUE, FALSE, 'Emergency or compassionate leave', 'company', 0, 3, '["Full-time", "Part-time"]', 'none'),
('study', 'Study Leave', 'STL', 30, 60, FALSE, 0, TRUE, TRUE, FALSE, 'Leave for educational purposes', 'company', 0, 24, '["Full-time"]', 'none');

-- Default role permissions
INSERT IGNORE INTO role_permissions (role_name, permission_name, permission_value, description) VALUES
-- Admin permissions (full access)
('Admin', 'dashboard_view', TRUE, 'View dashboard'),
('Admin', 'members_view', TRUE, 'View members'),
('Admin', 'members_create', TRUE, 'Create new members'),
('Admin', 'members_edit', TRUE, 'Edit member information'),
('Admin', 'members_delete', TRUE, 'Delete members'),
('Admin', 'hr_view', TRUE, 'View HR module'),
('Admin', 'hr_manage', TRUE, 'Manage HR operations'),
('Admin', 'finance_view', TRUE, 'View financial data'),
('Admin', 'finance_manage', TRUE, 'Manage financial transactions'),
('Admin', 'events_view', TRUE, 'View events'),
('Admin', 'events_manage', TRUE, 'Manage events'),
('Admin', 'inventory_view', TRUE, 'View inventory'),
('Admin', 'inventory_manage', TRUE, 'Manage inventory'),
('Admin', 'messaging_send', TRUE, 'Send messages'),
('Admin', 'welfare_view', TRUE, 'View welfare requests'),
('Admin', 'welfare_approve', TRUE, 'Approve welfare requests'),
('Admin', 'users_view', TRUE, 'View user accounts'),
('Admin', 'users_manage', TRUE, 'Manage user accounts'),
('Admin', 'system_logs_view', TRUE, 'View system logs'),
('Admin', 'system_settings', TRUE, 'Manage system settings'),

-- HR Officer permissions
('HR Officer', 'dashboard_view', TRUE, 'View dashboard'),
('HR Officer', 'members_view', TRUE, 'View members'),
('HR Officer', 'members_create', TRUE, 'Create new members'),
('HR Officer', 'members_edit', TRUE, 'Edit member information'),
('HR Officer', 'hr_view', TRUE, 'View HR module'),
('HR Officer', 'hr_manage', TRUE, 'Manage HR operations'),
('HR Officer', 'events_view', TRUE, 'View events'),
('HR Officer', 'messaging_send', TRUE, 'Send messages'),
('HR Officer', 'welfare_view', TRUE, 'View welfare requests'),

-- Finance Officer permissions
('Finance Officer', 'dashboard_view', TRUE, 'View dashboard'),
('Finance Officer', 'members_view', TRUE, 'View members'),
('Finance Officer', 'finance_view', TRUE, 'View financial data'),
('Finance Officer', 'finance_manage', TRUE, 'Manage financial transactions'),
('Finance Officer', 'inventory_view', TRUE, 'View inventory'),
('Finance Officer', 'inventory_manage', TRUE, 'Manage inventory'),
('Finance Officer', 'events_view', TRUE, 'View events'),
('Finance Officer', 'welfare_view', TRUE, 'View welfare requests'),

-- User permissions (basic access)
('User', 'dashboard_view', TRUE, 'View dashboard'),
('User', 'members_view', TRUE, 'View members'),
('User', 'events_view', TRUE, 'View events'),
('User', 'inventory_view', TRUE, 'View inventory');

-- Create default admin user
INSERT IGNORE INTO users (id, name, email, password_hash, role, is_active, can_create_accounts, can_delete_accounts, department, employee_id) VALUES
('admin-001', 'System Administrator', 'admin@tsoam.org', '$2a$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewDjCNVJ7q7Y.Fqe', 'Admin', TRUE, TRUE, TRUE, 'Administration', 'TSOAM-ADM-001');

-- Create additional default users
INSERT IGNORE INTO users (id, name, email, password_hash, role, is_active, can_create_accounts, department, employee_id) VALUES
('hr-001', 'HR Manager', 'hr@tsoam.org', '$2a$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewDjCNVJ7q7Y.Fqe', 'HR Officer', TRUE, TRUE, 'Human Resources', 'TSOAM-HR-001'),
('finance-001', 'Finance Manager', 'finance@tsoam.org', '$2a$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewDjCNVJ7q7Y.Fqe', 'Finance Officer', TRUE, FALSE, 'Finance', 'TSOAM-FIN-001');

-- =====================================================
-- 13. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_members_join_date ON members(join_date);
CREATE INDEX IF NOT EXISTS idx_members_status_name ON members(status, name);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date_type ON financial_transactions(transaction_date, type);
CREATE INDEX IF NOT EXISTS idx_events_date_status ON events(start_date, status);
CREATE INDEX IF NOT EXISTS idx_messages_created_status ON messages(created_at, status);
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp_module ON system_logs(timestamp, module);

-- =====================================================
-- 14. CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- Active members view
CREATE OR REPLACE VIEW active_members AS
SELECT 
  id, member_id, tithe_number, name, email, phone, 
  gender, marital_status, status, join_date, 
  baptized, baptism_date, created_at
FROM members 
WHERE status = 'Active';

-- Financial summary view
CREATE OR REPLACE VIEW financial_summary AS
SELECT 
  DATE_FORMAT(transaction_date, '%Y-%m') as month,
  type,
  category,
  SUM(amount) as total_amount,
  COUNT(*) as transaction_count
FROM financial_transactions 
WHERE status = 'Completed'
GROUP BY DATE_FORMAT(transaction_date, '%Y-%m'), type, category;

-- Employee summary view
CREATE OR REPLACE VIEW employee_summary AS
SELECT 
  e.id, e.employee_id, e.name, e.department, e.position,
  e.employment_type, e.employment_status, e.hire_date,
  u.email, u.role, u.is_active as user_active
FROM employees e
LEFT JOIN users u ON e.user_id = u.id
WHERE e.employment_status = 'Active';

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT '✅ TSOAM Church Management Database Schema Created Successfully!' as Status,
       '🔐 Default Admin: admin@tsoam.org / admin123' as Login,
       '👥 Database Users: tsoam_admin, tsoam_app, tsoam_readonly' as Users,
       CONCAT('📊 Total Tables: ', COUNT(*)) as TableCount
FROM information_schema.tables 
WHERE table_schema = 'tsoam_church_db';
