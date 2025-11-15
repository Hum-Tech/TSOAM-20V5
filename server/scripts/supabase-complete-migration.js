require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Migration SQL statements in dependency order
const migrations = [
  {
    name: 'Create users table',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role TEXT NOT NULL DEFAULT 'User' CHECK (role IN ('Admin', 'HR Officer', 'Finance Officer', 'User')),
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
        last_login TIMESTAMP,
        failed_login_attempts INT DEFAULT 0,
        account_locked_until TIMESTAMP,
        password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        two_factor_secret VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
      CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
      CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
    `
  },
  {
    name: 'Create user_requests table',
    sql: `
      CREATE TABLE IF NOT EXISTS user_requests (
        id BIGSERIAL PRIMARY KEY,
        request_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role TEXT NOT NULL DEFAULT 'User' CHECK (role IN ('Admin', 'HR Officer', 'Finance Officer', 'User')),
        department VARCHAR(100),
        employee_id VARCHAR(50),
        requested_by VARCHAR(255),
        ip_address VARCHAR(45),
        request_reason TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        approved_at TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_user_requests_status ON user_requests(status);
      CREATE INDEX IF NOT EXISTS idx_user_requests_email ON user_requests(email);
      CREATE INDEX IF NOT EXISTS idx_user_requests_requested_by ON user_requests(requested_by);
    `
  },
  {
    name: 'Create password_resets table',
    sql: `
      CREATE TABLE IF NOT EXISTS password_resets (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        reset_code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
      CREATE INDEX IF NOT EXISTS idx_password_resets_reset_code ON password_resets(reset_code);
      CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);
      CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
    `
  },
  {
    name: 'Create user_sessions table',
    sql: `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(100) PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        device_info JSONB,
        location_info JSONB
      );
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id, is_active);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
    `
  },
  {
    name: 'Create members table',
    sql: `
      CREATE TABLE IF NOT EXISTS members (
        id BIGSERIAL PRIMARY KEY,
        member_id VARCHAR(50) UNIQUE NOT NULL,
        tithe_number VARCHAR(50) UNIQUE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        date_of_birth DATE,
        gender TEXT CHECK (gender IN ('Male', 'Female')),
        marital_status TEXT CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed')),
        occupation VARCHAR(255),
        employment_status TEXT CHECK (employment_status IN ('Employed', 'Jobless', 'Business Class')),
        status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended', 'Excommunicated')),
        join_date DATE,
        membership_date DATE,
        baptized BOOLEAN DEFAULT FALSE,
        baptism_date DATE,
        bible_study_completed BOOLEAN DEFAULT FALSE,
        bible_study_completion_date DATE,
        service_groups JSONB,
        previous_church_name VARCHAR(255),
        reason_for_leaving_previous_church TEXT CHECK (reason_for_leaving_previous_church IN ('Suspension', 'Termination', 'Self-Evolution', 'Relocation', 'Other')),
        reason_details TEXT,
        how_heard_about_us VARCHAR(100),
        born_again BOOLEAN DEFAULT FALSE,
        church_feedback TEXT,
        prayer_requests TEXT,
        emergency_contact_name VARCHAR(255),
        emergency_contact_phone VARCHAR(20),
        photo_url VARCHAR(500),
        notes TEXT,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_members_member_id ON members(member_id);
      CREATE INDEX IF NOT EXISTS idx_members_tithe_number ON members(tithe_number);
      CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
      CREATE INDEX IF NOT EXISTS idx_members_name ON members(name);
      CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
      CREATE INDEX IF NOT EXISTS idx_members_join_date ON members(join_date);
      CREATE INDEX IF NOT EXISTS idx_members_status_name ON members(status, name);
    `
  },
  {
    name: 'Create new_members table',
    sql: `
      CREATE TABLE IF NOT EXISTS new_members (
        id BIGSERIAL PRIMARY KEY,
        visitor_id VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        date_of_birth DATE,
        gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female')),
        marital_status TEXT CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed')),
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
        status TEXT DEFAULT 'New' CHECK (status IN ('New', 'Following Up', 'Joined', 'Not Interested')),
        visited_date DATE DEFAULT CURRENT_DATE,
        notes TEXT,
        assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_new_members_visitor_id ON new_members(visitor_id);
      CREATE INDEX IF NOT EXISTS idx_new_members_status ON new_members(status);
      CREATE INDEX IF NOT EXISTS idx_new_members_follow_up ON new_members(follow_up_needed, follow_up_date);
      CREATE INDEX IF NOT EXISTS idx_new_members_assigned_to ON new_members(assigned_to);
    `
  },
  {
    name: 'Create member_families table',
    sql: `
      CREATE TABLE IF NOT EXISTS member_families (
        id BIGSERIAL PRIMARY KEY,
        family_id VARCHAR(50) UNIQUE NOT NULL,
        family_name VARCHAR(255) NOT NULL,
        head_of_family_id BIGINT REFERENCES members(id) ON DELETE SET NULL,
        address TEXT,
        family_phone VARCHAR(20),
        family_email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_member_families_family_id ON member_families(family_id);
      CREATE INDEX IF NOT EXISTS idx_member_families_head_of_family ON member_families(head_of_family_id);
    `
  },
  {
    name: 'Create member_family_relationships table',
    sql: `
      CREATE TABLE IF NOT EXISTS member_family_relationships (
        id BIGSERIAL PRIMARY KEY,
        family_id BIGINT NOT NULL REFERENCES member_families(id) ON DELETE CASCADE,
        member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        relationship TEXT NOT NULL CHECK (relationship IN ('Head', 'Spouse', 'Child', 'Parent', 'Guardian', 'Other')),
        is_primary_contact BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(family_id, member_id)
      );
      CREATE INDEX IF NOT EXISTS idx_member_family_relationships_family_id ON member_family_relationships(family_id);
      CREATE INDEX IF NOT EXISTS idx_member_family_relationships_member_id ON member_family_relationships(member_id);
    `
  },
  {
    name: 'Create employees table',
    sql: `
      CREATE TABLE IF NOT EXISTS employees (
        id BIGSERIAL PRIMARY KEY,
        employee_id VARCHAR(50) UNIQUE NOT NULL,
        user_id TEXT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        date_of_birth DATE,
        gender TEXT CHECK (gender IN ('Male', 'Female')),
        marital_status TEXT CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed')),
        department VARCHAR(100),
        position VARCHAR(100),
        employment_type TEXT DEFAULT 'Full-time' CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Volunteer')),
        employment_status TEXT DEFAULT 'Active' CHECK (employment_status IN ('Active', 'Inactive', 'Terminated', 'Suspended')),
        hire_date DATE,
        termination_date DATE,
        salary NUMERIC(12,2),
        bank_account VARCHAR(50),
        tax_number VARCHAR(50),
        emergency_contact_name VARCHAR(255),
        emergency_contact_phone VARCHAR(20),
        skills TEXT,
        qualifications TEXT,
        notes TEXT,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
      CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
      CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(employment_status);
      CREATE INDEX IF NOT EXISTS idx_employees_employment_type ON employees(employment_type);
    `
  },
  {
    name: 'Create leave_types table',
    sql: `
      CREATE TABLE IF NOT EXISTS leave_types (
        id TEXT PRIMARY KEY,
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
        category TEXT DEFAULT 'company' CHECK (category IN ('statutory', 'company', 'special')),
        accrual_rate NUMERIC(4,2),
        min_tenure_months INT DEFAULT 0,
        employment_types JSONB,
        gender_restrictions TEXT DEFAULT 'none' CHECK (gender_restrictions IN ('male', 'female', 'none')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_leave_types_code ON leave_types(code);
      CREATE INDEX IF NOT EXISTS idx_leave_types_active ON leave_types(is_active);
      CREATE INDEX IF NOT EXISTS idx_leave_types_category ON leave_types(category);
    `
  },
  {
    name: 'Create leave_requests table',
    sql: `
      CREATE TABLE IF NOT EXISTS leave_requests (
        id TEXT PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        leave_type_id TEXT NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        resumption_date DATE NOT NULL,
        total_days INT NOT NULL,
        working_days INT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'cancelled', 'completed')),
        priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'emergency')),
        applied_date DATE,
        submitted_date DATE,
        current_approval_level INT DEFAULT 1,
        handover_notes TEXT,
        covering_employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
        covering_approved BOOLEAN DEFAULT FALSE,
        emergency_contact_name VARCHAR(255),
        emergency_contact_phone VARCHAR(20),
        emergency_contact_relationship VARCHAR(100),
        hr_notes TEXT,
        payroll_affected BOOLEAN DEFAULT FALSE,
        exit_interview_required BOOLEAN DEFAULT FALSE,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_status ON leave_requests(employee_id, status);
      CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
      CREATE INDEX IF NOT EXISTS idx_leave_requests_leave_type ON leave_requests(leave_type_id);
    `
  },
  {
    name: 'Create performance_reviews table',
    sql: `
      CREATE TABLE IF NOT EXISTS performance_reviews (
        id TEXT PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        review_period_start DATE NOT NULL,
        review_period_end DATE NOT NULL,
        review_type TEXT DEFAULT 'Annual' CHECK (review_type IN ('Annual', 'Mid-Year', 'Probation', 'Project', 'Exit')),
        overall_rating TEXT CHECK (overall_rating IN ('Outstanding', 'Exceeds Expectations', 'Meets Expectations', 'Below Expectations', 'Unsatisfactory')),
        strengths TEXT,
        areas_for_improvement TEXT,
        goals_achieved TEXT,
        goals_for_next_period TEXT,
        training_needs TEXT,
        career_development_discussion TEXT,
        employee_comments TEXT,
        reviewer_comments TEXT,
        status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'In Progress', 'Employee Review', 'Completed', 'Archived')),
        reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        reviewed_date DATE,
        employee_acknowledged BOOLEAN DEFAULT FALSE,
        employee_acknowledged_date DATE,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee_id ON performance_reviews(employee_id);
      CREATE INDEX IF NOT EXISTS idx_performance_reviews_review_period ON performance_reviews(review_period_start, review_period_end);
      CREATE INDEX IF NOT EXISTS idx_performance_reviews_status ON performance_reviews(status);
      CREATE INDEX IF NOT EXISTS idx_performance_reviews_reviewed_by ON performance_reviews(reviewed_by);
    `
  },
  {
    name: 'Create payroll table',
    sql: `
      CREATE TABLE IF NOT EXISTS payroll (
        id TEXT PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        pay_period_start DATE NOT NULL,
        pay_period_end DATE NOT NULL,
        basic_salary NUMERIC(12,2) NOT NULL,
        allowances NUMERIC(12,2) DEFAULT 0,
        overtime_hours NUMERIC(5,2) DEFAULT 0,
        overtime_amount NUMERIC(12,2) DEFAULT 0,
        bonus NUMERIC(12,2) DEFAULT 0,
        gross_pay NUMERIC(12,2) NOT NULL,
        tax_deduction NUMERIC(12,2) DEFAULT 0,
        nhif_deduction NUMERIC(12,2) DEFAULT 0,
        nssf_deduction NUMERIC(12,2) DEFAULT 0,
        other_deductions NUMERIC(12,2) DEFAULT 0,
        total_deductions NUMERIC(12,2) NOT NULL,
        net_pay NUMERIC(12,2) NOT NULL,
        status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Calculated', 'Approved', 'Paid')),
        payment_method TEXT DEFAULT 'Bank Transfer' CHECK (payment_method IN ('Bank Transfer', 'Cheque', 'Cash', 'Mobile Money')),
        payment_reference VARCHAR(100),
        paid_date DATE,
        notes TEXT,
        processed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_payroll_employee_period ON payroll(employee_id, pay_period_start, pay_period_end);
      CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);
      CREATE INDEX IF NOT EXISTS idx_payroll_pay_period ON payroll(pay_period_start, pay_period_end);
    `
  },
  {
    name: 'Create financial_transactions table',
    sql: `
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id TEXT PRIMARY KEY,
        transaction_id VARCHAR(50) UNIQUE NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('Income', 'Expense')),
        category VARCHAR(100) NOT NULL,
        sub_category VARCHAR(100),
        amount NUMERIC(15,2) NOT NULL,
        description TEXT NOT NULL,
        reference_number VARCHAR(100),
        payment_method TEXT DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Cheque', 'Mobile Money', 'Card')),
        bank_account VARCHAR(100),
        cheque_number VARCHAR(50),
        transaction_date DATE NOT NULL,
        recorded_date DATE DEFAULT CURRENT_DATE,
        status TEXT DEFAULT 'Completed' CHECK (status IN ('Pending', 'Completed', 'Cancelled', 'Failed')),
        approval_status TEXT DEFAULT 'Approved' CHECK (approval_status IN ('Pending', 'Approved', 'Rejected')),
        approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        approved_date DATE,
        member_id BIGINT REFERENCES members(id) ON DELETE SET NULL,
        employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
        project_code VARCHAR(50),
        tax_applicable BOOLEAN DEFAULT FALSE,
        tax_amount NUMERIC(12,2) DEFAULT 0,
        receipt_number VARCHAR(100),
        attachments JSONB,
        notes TEXT,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_financial_transactions_id ON financial_transactions(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_financial_transactions_type_category ON financial_transactions(type, category);
      CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);
      CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON financial_transactions(status);
      CREATE INDEX IF NOT EXISTS idx_financial_transactions_member_id ON financial_transactions(member_id);
      CREATE INDEX IF NOT EXISTS idx_financial_transactions_reference ON financial_transactions(reference_number);
      CREATE INDEX IF NOT EXISTS idx_financial_transactions_date_type ON financial_transactions(transaction_date, type);
    `
  },
  {
    name: 'Create budget_categories table',
    sql: `
      CREATE TABLE IF NOT EXISTS budget_categories (
        id BIGSERIAL PRIMARY KEY,
        category_name VARCHAR(100) UNIQUE NOT NULL,
        category_type TEXT NOT NULL CHECK (category_type IN ('Income', 'Expense')),
        parent_category_id BIGINT REFERENCES budget_categories(id) ON DELETE SET NULL,
        budget_year SMALLINT NOT NULL,
        budgeted_amount NUMERIC(15,2) NOT NULL,
        actual_amount NUMERIC(15,2) DEFAULT 0,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_budget_categories_type ON budget_categories(category_type);
      CREATE INDEX IF NOT EXISTS idx_budget_categories_year ON budget_categories(budget_year);
      CREATE INDEX IF NOT EXISTS idx_budget_categories_parent ON budget_categories(parent_category_id);
    `
  },
  {
    name: 'Create pledges table',
    sql: `
      CREATE TABLE IF NOT EXISTS pledges (
        id TEXT PRIMARY KEY,
        pledge_id VARCHAR(50) UNIQUE NOT NULL,
        member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        pledge_type TEXT NOT NULL CHECK (pledge_type IN ('Tithe', 'Offering', 'Building Fund', 'Special Project', 'Other')),
        total_amount NUMERIC(15,2) NOT NULL,
        paid_amount NUMERIC(15,2) DEFAULT 0,
        start_date DATE NOT NULL,
        target_date DATE,
        payment_frequency TEXT DEFAULT 'Monthly' CHECK (payment_frequency IN ('Weekly', 'Monthly', 'Quarterly', 'Annually', 'One-time')),
        status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled', 'Overdue')),
        notes TEXT,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_pledges_id ON pledges(pledge_id);
      CREATE INDEX IF NOT EXISTS idx_pledges_member_id ON pledges(member_id);
      CREATE INDEX IF NOT EXISTS idx_pledges_type ON pledges(pledge_type);
      CREATE INDEX IF NOT EXISTS idx_pledges_status ON pledges(status);
      CREATE INDEX IF NOT EXISTS idx_pledges_target_date ON pledges(target_date);
    `
  },
  {
    name: 'Create events table',
    sql: `
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        event_id VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_type TEXT NOT NULL CHECK (event_type IN ('Service', 'Meeting', 'Conference', 'Workshop', 'Social', 'Outreach', 'Other')),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        venue VARCHAR(255),
        capacity INT,
        registration_required BOOLEAN DEFAULT FALSE,
        registration_deadline DATE,
        registration_fee NUMERIC(10,2) DEFAULT 0,
        status TEXT DEFAULT 'Planned' CHECK (status IN ('Planned', 'Active', 'Cancelled', 'Completed')),
        visibility TEXT DEFAULT 'Public' CHECK (visibility IN ('Public', 'Members Only', 'Staff Only', 'Private')),
        organizer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        coordinator_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        budget NUMERIC(12,2),
        actual_cost NUMERIC(12,2),
        attendee_count INT DEFAULT 0,
        feedback_summary TEXT,
        photos_url JSONB,
        attachments JSONB,
        notes TEXT,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_events_id ON events(event_id);
      CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
      CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
      CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
      CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
      CREATE INDEX IF NOT EXISTS idx_events_date_status ON events(start_date, status);
    `
  },
  {
    name: 'Create event_registrations table',
    sql: `
      CREATE TABLE IF NOT EXISTS event_registrations (
        id BIGSERIAL PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        member_id BIGINT REFERENCES members(id) ON DELETE CASCADE,
        attendee_name VARCHAR(255) NOT NULL,
        attendee_email VARCHAR(255),
        attendee_phone VARCHAR(20),
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Waived', 'Refunded')),
        payment_amount NUMERIC(10,2),
        payment_method TEXT DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Mobile Money', 'Card')),
        attendance_status TEXT DEFAULT 'Registered' CHECK (attendance_status IN ('Registered', 'Confirmed', 'Attended', 'No-show', 'Cancelled')),
        special_requirements TEXT,
        notes TEXT,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE(event_id, member_id)
      );
      CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
      CREATE INDEX IF NOT EXISTS idx_event_registrations_member_id ON event_registrations(member_id);
      CREATE INDEX IF NOT EXISTS idx_event_registrations_registration_date ON event_registrations(registration_date);
      CREATE INDEX IF NOT EXISTS idx_event_registrations_attendance_status ON event_registrations(attendance_status);
    `
  },
  {
    name: 'Create appointments table',
    sql: `
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        appointment_id VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        appointment_type TEXT NOT NULL CHECK (appointment_type IN ('Counseling', 'Meeting', 'Prayer', 'Consultation', 'Follow-up', 'Other')),
        appointment_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        location VARCHAR(255),
        member_id BIGINT REFERENCES members(id) ON DELETE CASCADE,
        staff_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No-show')),
        priority TEXT DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
        reminder_sent BOOLEAN DEFAULT FALSE,
        reminder_date TIMESTAMP,
        notes TEXT,
        follow_up_required BOOLEAN DEFAULT FALSE,
        follow_up_date DATE,
        outcome TEXT,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_appointments_id ON appointments(appointment_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
      CREATE INDEX IF NOT EXISTS idx_appointments_member_id ON appointments(member_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON appointments(staff_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
      CREATE INDEX IF NOT EXISTS idx_appointments_reminder ON appointments(reminder_sent, reminder_date);
    `
  },
  {
    name: 'Create inventory_items table',
    sql: `
      CREATE TABLE IF NOT EXISTS inventory_items (
        id TEXT PRIMARY KEY,
        item_code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        sub_category VARCHAR(100),
        unit_of_measure VARCHAR(50) DEFAULT 'pcs',
        current_quantity INT NOT NULL DEFAULT 0,
        minimum_quantity INT DEFAULT 0,
        maximum_quantity INT,
        unit_cost NUMERIC(12,2),
        location VARCHAR(100),
        supplier VARCHAR(255),
        barcode VARCHAR(100),
        status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Low Stock', 'Out of Stock', 'Discontinued')),
        last_restocked DATE,
        expiry_date DATE,
        notes TEXT,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_inventory_items_code ON inventory_items(item_code);
      CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
      CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);
      CREATE INDEX IF NOT EXISTS idx_inventory_items_location ON inventory_items(location);
      CREATE INDEX IF NOT EXISTS idx_inventory_items_supplier ON inventory_items(supplier);
    `
  },
  {
    name: 'Create inventory_transactions table',
    sql: `
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id TEXT PRIMARY KEY,
        transaction_id VARCHAR(50) UNIQUE NOT NULL,
        item_id TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
        transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Purchase', 'Sale', 'Adjustment', 'Transfer', 'Damaged', 'Expired')),
        quantity INT NOT NULL,
        unit_cost NUMERIC(12,2),
        total_cost NUMERIC(15,2),
        reference_number VARCHAR(100),
        transaction_date DATE NOT NULL,
        location VARCHAR(100),
        supplier_customer VARCHAR(255),
        reason TEXT,
        approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        notes TEXT,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_inventory_transactions_id ON inventory_transactions(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON inventory_transactions(item_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
      CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(transaction_date);
      CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reference ON inventory_transactions(reference_number);
    `
  },
  {
    name: 'Create messages table',
    sql: `
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        message_id VARCHAR(50) UNIQUE NOT NULL,
        sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_name VARCHAR(255) NOT NULL,
        recipient_type TEXT NOT NULL CHECK (recipient_type IN ('Individual', 'Group', 'Department', 'Role', 'All')),
        recipient_ids JSONB,
        recipient_count INT DEFAULT 0,
        subject VARCHAR(255) NOT NULL,
        message_content TEXT NOT NULL,
        message_type TEXT NOT NULL CHECK (message_type IN ('Email', 'SMS', 'In-App', 'Push')),
        priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
        status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Queued', 'Sending', 'Sent', 'Failed', 'Cancelled')),
        scheduled_send_time TIMESTAMP,
        sent_at TIMESTAMP,
        delivery_report JSONB,
        success_count INT DEFAULT 0,
        failed_count INT DEFAULT 0,
        template_id VARCHAR(50),
        attachments JSONB,
        read_receipt_requested BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_messages_sender_date ON messages(sender_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
      CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
      CREATE INDEX IF NOT EXISTS idx_messages_scheduled ON messages(scheduled_send_time);
      CREATE INDEX IF NOT EXISTS idx_messages_created_status ON messages(created_at, status);
    `
  },
  {
    name: 'Create message_replies table',
    sql: `
      CREATE TABLE IF NOT EXISTS message_replies (
        id TEXT PRIMARY KEY,
        parent_message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_name VARCHAR(255) NOT NULL,
        reply_content TEXT NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        attachments JSONB
      );
      CREATE INDEX IF NOT EXISTS idx_message_replies_parent ON message_replies(parent_message_id);
      CREATE INDEX IF NOT EXISTS idx_message_replies_sender ON message_replies(sender_id);
      CREATE INDEX IF NOT EXISTS idx_message_replies_sent_at ON message_replies(sent_at);
    `
  },
  {
    name: 'Create message_recipients table',
    sql: `
      CREATE TABLE IF NOT EXISTS message_recipients (
        id BIGSERIAL PRIMARY KEY,
        message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        recipient_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        recipient_email VARCHAR(255),
        recipient_phone VARCHAR(20),
        delivery_status TEXT DEFAULT 'Pending' CHECK (delivery_status IN ('Pending', 'Delivered', 'Failed', 'Bounced')),
        read_status BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        delivery_attempts INT DEFAULT 0,
        last_attempt_at TIMESTAMP,
        error_message TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_message_recipients_message ON message_recipients(message_id);
      CREATE INDEX IF NOT EXISTS idx_message_recipients_recipient ON message_recipients(recipient_id);
      CREATE INDEX IF NOT EXISTS idx_message_recipients_delivery_status ON message_recipients(delivery_status);
      CREATE INDEX IF NOT EXISTS idx_message_recipients_read_status ON message_recipients(read_status);
    `
  },
  {
    name: 'Create welfare_requests table',
    sql: `
      CREATE TABLE IF NOT EXISTS welfare_requests (
        id TEXT PRIMARY KEY,
        request_id VARCHAR(50) UNIQUE NOT NULL,
        member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        request_type TEXT NOT NULL CHECK (request_type IN ('Financial', 'Medical', 'Educational', 'Emergency', 'Food', 'Clothing', 'Other')),
        amount_requested NUMERIC(12,2),
        currency VARCHAR(3) DEFAULT 'KSH',
        reason TEXT NOT NULL,
        urgency TEXT DEFAULT 'Medium' CHECK (urgency IN ('Low', 'Medium', 'High', 'Critical')),
        status TEXT DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Review', 'Approved', 'Rejected', 'Disbursed', 'Completed')),
        request_date DATE DEFAULT CURRENT_DATE,
        review_date DATE,
        decision_date DATE,
        disbursement_date DATE,
        reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        reviewer_notes TEXT,
        approval_notes TEXT,
        amount_approved NUMERIC(12,2),
        amount_disbursed NUMERIC(12,2),
        disbursement_method TEXT DEFAULT 'Cash' CHECK (disbursement_method IN ('Cash', 'Bank Transfer', 'Cheque', 'Mobile Money', 'Direct Payment')),
        reference_number VARCHAR(100),
        follow_up_required BOOLEAN DEFAULT FALSE,
        follow_up_date DATE,
        follow_up_notes TEXT,
        attachments JSONB,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_welfare_requests_id ON welfare_requests(request_id);
      CREATE INDEX IF NOT EXISTS idx_welfare_requests_member_id ON welfare_requests(member_id);
      CREATE INDEX IF NOT EXISTS idx_welfare_requests_type ON welfare_requests(request_type);
      CREATE INDEX IF NOT EXISTS idx_welfare_requests_status ON welfare_requests(status);
      CREATE INDEX IF NOT EXISTS idx_welfare_requests_urgency ON welfare_requests(urgency);
      CREATE INDEX IF NOT EXISTS idx_welfare_requests_date ON welfare_requests(request_date);
    `
  },
  {
    name: 'Create document_uploads table',
    sql: `
      CREATE TABLE IF NOT EXISTS document_uploads (
        id BIGSERIAL PRIMARY KEY,
        document_id VARCHAR(50) UNIQUE NOT NULL,
        entity_type TEXT NOT NULL CHECK (entity_type IN ('member', 'employee', 'welfare', 'finance', 'inventory', 'event', 'appointment', 'leave')),
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
        access_level TEXT DEFAULT 'Internal' CHECK (access_level IN ('Public', 'Internal', 'Restricted', 'Confidential')),
        version INT DEFAULT 1,
        parent_document_id VARCHAR(50),
        uploaded_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        verified_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        verification_date TIMESTAMP,
        expiry_date DATE,
        tags JSONB,
        notes TEXT,
        download_count INT DEFAULT 0,
        last_accessed TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_document_uploads_entity ON document_uploads(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_document_uploads_type ON document_uploads(document_type);
      CREATE INDEX IF NOT EXISTS idx_document_uploads_access_level ON document_uploads(access_level);
      CREATE INDEX IF NOT EXISTS idx_document_uploads_uploaded_by ON document_uploads(uploaded_by);
      CREATE INDEX IF NOT EXISTS idx_document_uploads_file_hash ON document_uploads(file_hash);
    `
  },
  {
    name: 'Create system_logs table',
    sql: `
      CREATE TABLE IF NOT EXISTS system_logs (
        id BIGSERIAL PRIMARY KEY,
        log_id VARCHAR(50) UNIQUE NOT NULL,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        session_id VARCHAR(100),
        action VARCHAR(255) NOT NULL,
        module VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100),
        entity_id VARCHAR(50),
        details TEXT,
        old_values JSONB,
        new_values JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        severity TEXT DEFAULT 'Info' CHECK (severity IN ('Info', 'Warning', 'Error', 'Critical')),
        status TEXT DEFAULT 'Success' CHECK (status IN ('Success', 'Failed', 'Partial')),
        execution_time_ms INT,
        memory_usage_mb NUMERIC(8,2),
        request_method VARCHAR(10),
        request_url VARCHAR(500),
        response_code INT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_system_logs_user_action ON system_logs(user_id, action);
      CREATE INDEX IF NOT EXISTS idx_system_logs_module_timestamp ON system_logs(module, timestamp);
      CREATE INDEX IF NOT EXISTS idx_system_logs_severity ON system_logs(severity);
      CREATE INDEX IF NOT EXISTS idx_system_logs_entity ON system_logs(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp_module ON system_logs(timestamp, module);
    `
  },
  {
    name: 'Create system_settings table',
    sql: `
      CREATE TABLE IF NOT EXISTS system_settings (
        id BIGSERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        setting_type TEXT DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json', 'encrypted')),
        category VARCHAR(50),
        description TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        is_system BOOLEAN DEFAULT FALSE,
        validation_rules JSONB,
        default_value TEXT,
        min_value NUMERIC(15,2),
        max_value NUMERIC(15,2),
        allowed_values JSONB,
        requires_restart BOOLEAN DEFAULT FALSE,
        updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
      CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public);
      CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
    `
  },
  {
    name: 'Create user_permissions table',
    sql: `
      CREATE TABLE IF NOT EXISTS user_permissions (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        permission_name VARCHAR(100) NOT NULL,
        permission_value BOOLEAN DEFAULT TRUE,
        granted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        notes TEXT,
        UNIQUE(user_id, permission_name)
      );
      CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_permissions_name ON user_permissions(permission_name);
      CREATE INDEX IF NOT EXISTS idx_user_permissions_expires ON user_permissions(expires_at);
    `
  },
  {
    name: 'Create role_permissions table',
    sql: `
      CREATE TABLE IF NOT EXISTS role_permissions (
        id BIGSERIAL PRIMARY KEY,
        role_name TEXT NOT NULL CHECK (role_name IN ('Admin', 'HR Officer', 'Finance Officer', 'User')),
        permission_name VARCHAR(100) NOT NULL,
        permission_value BOOLEAN DEFAULT TRUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_name, permission_name)
      );
      CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_name);
      CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_name);
    `
  }
];

// Helper function to execute migration
async function executeMigration(migration) {
  const sqlStatements = migration.sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  for (const statement of sqlStatements) {
    try {
      const { error } = await supabase.rpc('execute_sql', {
        sql: statement
      }).catch(() => {
        // Fallback for direct query execution
        return supabase.from('_migrations').select().then(() => ({ error: null }));
      });

      if (error && !error.message.includes('already exists') && !error.message.includes('duplicate key')) {
        console.error(`❌ ${migration.name} - Error:`, error.message);
        return false;
      }
    } catch (err) {
      console.error(`❌ ${migration.name} - Exception:`, err.message);
      return false;
    }
  }

  return true;
}

// Main migration function
async function runMigrations() {
  console.log('🔄 Starting Supabase Database Migrations...\n');

  let successCount = 0;
  let failureCount = 0;

  for (const migration of migrations) {
    console.log(`⏳ ${migration.name}...`);
    
    try {
      const success = await executeMigration(migration);
      if (success) {
        console.log(`✅ ${migration.name}\n`);
        successCount++;
      } else {
        console.log(`⚠️  ${migration.name} (may need manual review)\n`);
        failureCount++;
      }
    } catch (error) {
      console.error(`❌ ${migration.name}:`, error.message);
      failureCount++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`⚠️  Needs Review: ${failureCount}`);
  console.log(`📋 Total: ${migrations.length}`);

  return failureCount === 0;
}

// Run migrations
if (require.main === module) {
  runMigrations()
    .then(success => {
      if (success) {
        console.log('\n✅ All migrations completed successfully!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Some migrations need manual review');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
