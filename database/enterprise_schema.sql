-- TSOAM Church Management System - Complete Enterprise Database Schema
-- MySQL 8.0+ Compatible - No DELIMITER statements for Node.js compatibility
-- This schema includes all tables needed for the comprehensive system

-- Create database
CREATE DATABASE IF NOT EXISTS tsoam_church_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tsoam_church_db;

-- =====================================================
-- CORE SYSTEM TABLES
-- =====================================================

-- Users table (Enhanced)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'HR Officer', 'Finance Officer', 'User') NOT NULL,
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
);

-- Password Reset table
CREATE TABLE IF NOT EXISTS password_resets (
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
    INDEX idx_user_id (user_id),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- MEMBER MANAGEMENT TABLES
-- =====================================================

-- Members table (Enhanced for full membership)
CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id VARCHAR(50) UNIQUE NOT NULL,
    tithe_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    gender ENUM('Male', 'Female') NOT NULL,
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
    transferred_from_new_member_id INT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_member_id (member_id),
    INDEX idx_tithe_number (tithe_number),
    INDEX idx_status (status)
);

-- New Members table (for those in transition process)
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
);

-- =====================================================
-- HR MANAGEMENT TABLES
-- =====================================================

-- Employees table (Enhanced)
CREATE TABLE IF NOT EXISTS employees (
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
    INDEX idx_department (department),
    FOREIGN KEY (supervisor_id) REFERENCES employees(id)
);

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Leave Balances table
CREATE TABLE IF NOT EXISTS leave_balances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_type_id VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    entitlement DECIMAL(5,2) NOT NULL,
    used_days DECIMAL(5,2) DEFAULT 0,
    pending_days DECIMAL(5,2) DEFAULT 0,
    available_days DECIMAL(5,2) GENERATED ALWAYS AS (entitlement - used_days - pending_days) STORED,
    carried_over DECIMAL(5,2) DEFAULT 0,
    forfeited DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_employee_leave_year (employee_id, leave_type_id, year),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id)
);

-- Leave Requests table (Enhanced)
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
    applied_date DATE DEFAULT (CURRENT_DATE),
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
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    FOREIGN KEY (covering_employee_id) REFERENCES employees(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Leave Approval History table
CREATE TABLE IF NOT EXISTS leave_approval_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    leave_request_id VARCHAR(50) NOT NULL,
    approval_level INT NOT NULL,
    approver_type ENUM('supervisor', 'hr', 'finance', 'executive') NOT NULL,
    approver_id VARCHAR(36),
    approver_name VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected', 'skipped') NOT NULL,
    action_date TIMESTAMP NULL,
    comments TEXT,
    delegated_to_id VARCHAR(36),
    delegated_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_leave_request (leave_request_id),
    FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id),
    FOREIGN KEY (delegated_to_id) REFERENCES users(id)
);

-- Performance Reviews table
CREATE TABLE IF NOT EXISTS performance_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    reviewer_id VARCHAR(36) NOT NULL,
    review_period VARCHAR(20) NOT NULL,
    review_type ENUM('annual', 'quarterly', 'probation', 'mid-year') NOT NULL,
    overall_rating DECIMAL(3,2),
    competency_average DECIMAL(3,2),
    key_achievements TEXT,
    areas_of_strength TEXT,
    development_opportunities TEXT,
    strategic_objectives TEXT,
    professional_development_plan TEXT,
    goals_next_period TEXT,
    status ENUM('draft', 'completed', 'approved') DEFAULT 'draft',
    due_date DATE,
    completion_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_employee_period (employee_id, review_period),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

-- Performance Competencies table
CREATE TABLE IF NOT EXISTS performance_competencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL,
    competency_name VARCHAR(100) NOT NULL,
    competency_description TEXT,
    rating DECIMAL(3,2) NOT NULL,
    comments TEXT,

    FOREIGN KEY (review_id) REFERENCES performance_reviews(id) ON DELETE CASCADE
);

-- =====================================================
-- APPOINTMENT MANAGEMENT TABLES
-- =====================================================

-- Appointments table (Enhanced)
CREATE TABLE IF NOT EXISTS appointments (
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
    INDEX idx_organizer (organizer_id),
    FOREIGN KEY (organizer_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Appointment Participants table
CREATE TABLE IF NOT EXISTS appointment_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id VARCHAR(50) NOT NULL,
    participant_id VARCHAR(100) NOT NULL,
    participant_name VARCHAR(255) NOT NULL,
    participant_email VARCHAR(255),
    role VARCHAR(100),
    status ENUM('pending', 'accepted', 'declined', 'tentative') DEFAULT 'pending',
    response_date TIMESTAMP NULL,

    UNIQUE KEY unique_appointment_participant (appointment_id, participant_id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

-- Appointment Resources table
CREATE TABLE IF NOT EXISTS appointment_resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    resource_name VARCHAR(255) NOT NULL,
    resource_type ENUM('room', 'equipment', 'vehicle', 'other') NOT NULL,
    location VARCHAR(255),
    capacity INT,
    reserved_from DATETIME NOT NULL,
    reserved_until DATETIME NOT NULL,

    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

-- Appointment Reminders table
CREATE TABLE IF NOT EXISTS appointment_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id VARCHAR(50) NOT NULL,
    reminder_type ENUM('email', 'sms', 'notification') NOT NULL,
    time_before_minutes INT NOT NULL,
    recipients JSON,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    sent_at TIMESTAMP NULL,

    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

-- =====================================================
-- FINANCE MANAGEMENT TABLES
-- =====================================================

-- Financial Transactions table (Enhanced)
CREATE TABLE IF NOT EXISTS financial_transactions (
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
    INDEX idx_member (member_id),
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Tithe Records table (Enhanced)
CREATE TABLE IF NOT EXISTS tithe_records (
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
    INDEX idx_financial_year (financial_year),
    FOREIGN KEY (member_id) REFERENCES members(id)
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    budget_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    financial_year INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    allocated_amount DECIMAL(15,2) NOT NULL,
    spent_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) GENERATED ALWAYS AS (allocated_amount - spent_amount) STORED,
    status ENUM('Draft', 'Approved', 'Active', 'Closed') DEFAULT 'Draft',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_by VARCHAR(36),
    approved_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_financial_year (financial_year),
    INDEX idx_category (category),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- =====================================================
-- WELFARE MANAGEMENT TABLES
-- =====================================================

-- Welfare Requests table (Enhanced)
CREATE TABLE IF NOT EXISTS welfare_requests (
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
    INDEX idx_member (member_id),
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- =====================================================
-- EVENT MANAGEMENT TABLES
-- =====================================================

-- Events table (Enhanced)
CREATE TABLE IF NOT EXISTS events (
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
    INDEX idx_status (status),
    FOREIGN KEY (organizer_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Event Registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(50) NOT NULL,
    registrant_name VARCHAR(255) NOT NULL,
    registrant_email VARCHAR(255),
    registrant_phone VARCHAR(20),
    member_id INT,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registration_status ENUM('Registered', 'Confirmed', 'Cancelled', 'No Show') DEFAULT 'Registered',
    payment_status ENUM('Pending', 'Paid', 'Waived', 'Refunded') DEFAULT 'Pending',
    amount_paid DECIMAL(10,2) DEFAULT 0,
    payment_reference VARCHAR(100),
    special_requirements TEXT,
    confirmation_sent BOOLEAN DEFAULT FALSE,

    UNIQUE KEY unique_event_registrant (event_id, registrant_email),
    INDEX idx_registration_status (registration_status),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id)
);

-- =====================================================
-- INVENTORY MANAGEMENT TABLES
-- =====================================================

-- Inventory Items table (Enhanced)
CREATE TABLE IF NOT EXISTS inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    description TEXT,
    quantity INT NOT NULL DEFAULT 0,
    unit_cost DECIMAL(12,2) NOT NULL,
    total_value DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
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
);

-- Inventory Movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    movement_type ENUM('Purchase', 'Sale', 'Transfer', 'Adjustment', 'Disposal', 'Return', 'Damage') NOT NULL,
    quantity_change INT NOT NULL,
    unit_cost DECIMAL(10,2),
    total_value DECIMAL(12,2),
    from_location VARCHAR(100),
    to_location VARCHAR(100),
    reference_number VARCHAR(100),
    reason TEXT,
    performed_by VARCHAR(36),
    approved_by VARCHAR(36),
    movement_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_item_date (item_id, movement_date),
    INDEX idx_movement_type (movement_type),
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (performed_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Maintenance Records table
CREATE TABLE IF NOT EXISTS maintenance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    maintenance_type ENUM('Routine', 'Repair', 'Replacement', 'Inspection', 'Cleaning', 'Calibration') NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(12,2) DEFAULT 0,
    technician_name VARCHAR(255),
    technician_contact VARCHAR(100),
    date_scheduled DATE,
    date_performed DATE NOT NULL,
    duration_hours DECIMAL(4,2),
    next_maintenance_date DATE,
    status ENUM('Completed', 'Pending', 'Cancelled') DEFAULT 'Completed',
    parts_replaced TEXT,
    warranty_period_months INT,
    notes TEXT,
    performed_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_item_date (item_id, date_performed),
    INDEX idx_maintenance_type (maintenance_type),
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- =====================================================
-- MESSAGING SYSTEM TABLES
-- =====================================================

-- Messages table (Enhanced)
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
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- Message Templates table
CREATE TABLE IF NOT EXISTS message_templates (
    id VARCHAR(50) PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    template_type ENUM('Email', 'SMS', 'In-App') NOT NULL,
    category VARCHAR(100),
    subject VARCHAR(255),
    content TEXT NOT NULL,
    variables JSON,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INT DEFAULT 0,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_template_type (template_type),
    INDEX idx_category (category),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Message Recipients table (for tracking individual deliveries)
CREATE TABLE IF NOT EXISTS message_recipients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id VARCHAR(50) NOT NULL,
    recipient_id VARCHAR(100),
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    recipient_name VARCHAR(255),
    delivery_status ENUM('Pending', 'Sent', 'Delivered', 'Read', 'Failed', 'Bounced') DEFAULT 'Pending',
    delivery_time TIMESTAMP NULL,
    read_time TIMESTAMP NULL,
    error_message TEXT,
    delivery_attempts INT DEFAULT 0,

    INDEX idx_message_status (message_id, delivery_status),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- =====================================================
-- DOCUMENT MANAGEMENT TABLES
-- =====================================================

-- Document Uploads table (Enhanced)
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
    INDEX idx_uploaded_by (uploaded_by),
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id),
    FOREIGN KEY (parent_document_id) REFERENCES document_uploads(document_id)
);

-- =====================================================
-- NOTIFICATION SYSTEM TABLES
-- =====================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
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
    INDEX idx_scheduled (scheduled_for),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- AUDIT AND LOGGING TABLES
-- =====================================================

-- System Logs table (Enhanced)
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
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Audit Trail table (for sensitive operations)
CREATE TABLE IF NOT EXISTS audit_trail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    audit_id VARCHAR(50) UNIQUE NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(50) NOT NULL,
    operation ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_data JSON,
    new_data JSON,
    changed_fields JSON,
    user_id VARCHAR(36) NOT NULL,
    user_name VARCHAR(255),
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_table_record (table_name, record_id),
    INDEX idx_user_timestamp (user_id, timestamp),
    INDEX idx_operation (operation),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================================================
-- SYSTEM CONFIGURATION TABLES
-- =====================================================

-- System Settings table (Enhanced)
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
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- User Sessions table (for session management)
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
);

-- =====================================================
-- DEFAULT DATA INSERTION
-- =====================================================

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO users (id, name, email, password_hash, role, is_active, can_create_accounts, can_delete_accounts)
VALUES ('admin-001', 'System Administrator', 'admin@tsoam.org', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', TRUE, TRUE, TRUE);

-- Insert default leave types
INSERT IGNORE INTO leave_types (id, name, code, default_days, max_days_per_year, carry_over_allowed, max_carry_over_days, requires_approval, requires_documentation, is_paid, description, category, accrual_rate, min_tenure_months, employment_types, gender_restrictions) VALUES
('annual', 'Annual Leave', 'AL', 21, 30, TRUE, 5, TRUE, FALSE, TRUE, 'Standard annual vacation leave', 'statutory', 1.75, 0, '["Full-time", "Part-time"]', 'none'),
('sick', 'Sick Leave', 'SL', 30, 60, FALSE, 0, TRUE, TRUE, TRUE, 'Medical leave for illness or injury', 'statutory', 0, 0, '["Full-time", "Part-time", "Volunteer"]', 'none'),
('maternity', 'Maternity Leave', 'ML', 90, 120, FALSE, 0, TRUE, TRUE, TRUE, 'Maternity leave for childbirth', 'statutory', 0, 12, '["Full-time", "Part-time"]', 'female'),
('paternity', 'Paternity Leave', 'PL', 14, 14, FALSE, 0, TRUE, TRUE, TRUE, 'Paternity leave for new fathers', 'statutory', 0, 12, '["Full-time", "Part-time"]', 'male'),
('emergency', 'Emergency Leave', 'EL', 5, 10, FALSE, 0, TRUE, TRUE, FALSE, 'Emergency or compassionate leave', 'company', 0, 3, '["Full-time", "Part-time"]', 'none'),
('study', 'Study Leave', 'STL', 30, 60, FALSE, 0, TRUE, TRUE, FALSE, 'Leave for educational purposes', 'company', 0, 24, '["Full-time"]', 'none');

-- Insert default system settings
INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('church_name', 'The Seed of Abraham Ministry (TSOAM)', 'string', 'general', 'Official church name', TRUE),
('church_address', 'Nairobi, Kenya', 'string', 'general', 'Church physical address', TRUE),
('church_phone', '+254 700 000 000', 'string', 'general', 'Church contact phone', TRUE),
('church_email', 'admin@tsoam.org', 'string', 'general', 'Church contact email', TRUE),
('currency', 'KSH', 'string', 'finance', 'Default currency', TRUE),
('timezone', 'Africa/Nairobi', 'string', 'general', 'Default timezone', FALSE),
('backup_frequency', 'daily', 'string', 'system', 'Automatic backup frequency', FALSE),
('max_login_attempts', '5', 'number', 'security', 'Maximum login attempts before lockout', FALSE),
('session_timeout_minutes', '60', 'number', 'security', 'Session timeout in minutes', FALSE),
('file_upload_max_size', '10485760', 'number', 'system', 'Maximum file upload size in bytes (10MB)', FALSE),
('allowed_file_types', '["pdf", "doc", "docx", "jpg", "jpeg", "png", "gif", "txt", "csv", "xlsx"]', 'json', 'system', 'Allowed file types for upload', FALSE);

-- =====================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =====================================================

-- Performance indexes for commonly queried combinations
-- Note: These indexes are created during database initialization

COMMIT;

-- End of Enterprise Database Schema (MySQL 8.0+ Compatible)
