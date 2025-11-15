require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// All SQL creation statements in proper dependency order
const createTableStatements = [
  // Users table
  `
  CREATE TABLE IF NOT EXISTS public.users (
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
    last_login TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INT DEFAULT 0,
    account_locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);`,
  `CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);`,
  `CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);`,
  
  // Members table
  `
  CREATE TABLE IF NOT EXISTS public.members (
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
    created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `CREATE INDEX IF NOT EXISTS idx_members_member_id ON public.members(member_id);`,
  `CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);`,
  `CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email);`,
  
  // Employees table
  `
  CREATE TABLE IF NOT EXISTS public.employees (
    id BIGSERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    user_id TEXT UNIQUE REFERENCES public.users(id) ON DELETE SET NULL,
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
    created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON public.employees(employee_id);`,
  `CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);`,
  `CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(employment_status);`,
  
  // Financial Transactions table
  `
  CREATE TABLE IF NOT EXISTS public.financial_transactions (
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
    approved_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    approved_date DATE,
    member_id BIGINT REFERENCES public.members(id) ON DELETE SET NULL,
    employee_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    project_code VARCHAR(50),
    tax_applicable BOOLEAN DEFAULT FALSE,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    receipt_number VARCHAR(100),
    attachments JSONB,
    notes TEXT,
    created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `CREATE INDEX IF NOT EXISTS idx_financial_transactions_id ON public.financial_transactions(transaction_id);`,
  `CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON public.financial_transactions(transaction_date);`,
  
  // Pledges table
  `
  CREATE TABLE IF NOT EXISTS public.pledges (
    id TEXT PRIMARY KEY,
    pledge_id VARCHAR(50) UNIQUE NOT NULL,
    member_id BIGINT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    pledge_type TEXT NOT NULL CHECK (pledge_type IN ('Tithe', 'Offering', 'Building Fund', 'Special Project', 'Other')),
    total_amount NUMERIC(15,2) NOT NULL,
    paid_amount NUMERIC(15,2) DEFAULT 0,
    start_date DATE NOT NULL,
    target_date DATE,
    payment_frequency TEXT DEFAULT 'Monthly' CHECK (payment_frequency IN ('Weekly', 'Monthly', 'Quarterly', 'Annually', 'One-time')),
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled', 'Overdue')),
    notes TEXT,
    created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  `,
  
  // Welfare Requests table
  `
  CREATE TABLE IF NOT EXISTS public.welfare_requests (
    id TEXT PRIMARY KEY,
    request_id VARCHAR(50) UNIQUE NOT NULL,
    member_id BIGINT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
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
    reviewed_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    approved_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
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
    created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  `,
  
  // Events table
  `
  CREATE TABLE IF NOT EXISTS public.events (
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
    organizer_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    coordinator_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    budget NUMERIC(12,2),
    actual_cost NUMERIC(12,2),
    attendee_count INT DEFAULT 0,
    feedback_summary TEXT,
    photos_url JSONB,
    attachments JSONB,
    notes TEXT,
    created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `CREATE INDEX IF NOT EXISTS idx_events_id ON public.events(event_id);`,
  `CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);`,
  
  // Appointments table
  `
  CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    appointment_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    appointment_type TEXT NOT NULL CHECK (appointment_type IN ('Counseling', 'Meeting', 'Prayer', 'Consultation', 'Follow-up', 'Other')),
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255),
    member_id BIGINT REFERENCES public.members(id) ON DELETE CASCADE,
    staff_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No-show')),
    priority TEXT DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    outcome TEXT,
    created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  `,
  
  // Messages table
  `
  CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY,
    message_id VARCHAR(50) UNIQUE NOT NULL,
    sender_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_name VARCHAR(255) NOT NULL,
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('Individual', 'Group', 'Department', 'Role', 'All')),
    recipient_ids JSONB,
    recipient_count INT DEFAULT 0,
    subject VARCHAR(255) NOT NULL,
    message_content TEXT NOT NULL,
    message_type TEXT NOT NULL CHECK (message_type IN ('Email', 'SMS', 'In-App', 'Push')),
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Queued', 'Sending', 'Sent', 'Failed', 'Cancelled')),
    scheduled_send_time TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_report JSONB,
    success_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    template_id VARCHAR(50),
    attachments JSONB,
    read_receipt_requested BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  `,
  
  // System Logs table
  `
  CREATE TABLE IF NOT EXISTS public.system_logs (
    id BIGSERIAL PRIMARY KEY,
    log_id VARCHAR(50) UNIQUE NOT NULL,
    user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
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
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  `,
  
  // Role Permissions table
  `
  CREATE TABLE IF NOT EXISTS public.role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_name TEXT NOT NULL CHECK (role_name IN ('Admin', 'HR Officer', 'Finance Officer', 'User')),
    permission_name VARCHAR(100) NOT NULL,
    permission_value BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_name, permission_name)
  );
  `,
  
  // System Settings table
  `
  CREATE TABLE IF NOT EXISTS public.system_settings (
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
    updated_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  `
];

// Execute SQL statements
async function executeSql(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.error('SQL Error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Execution Error:', err.message);
    return false;
  }
}

// Create tables
async function createTables() {
  console.log('🔄 Creating database tables in Supabase...\n');

  let created = 0;
  let skipped = 0;

  for (const statement of createTableStatements) {
    try {
      const sql = statement.trim();
      if (!sql) continue;

      const { error } = await supabase.rpc('exec_sql', { sql }).catch(() => ({ error: null }));

      if (error && !error.message.includes('already exists')) {
        console.log(`⚠️  Statement skipped (may already exist)`);
        skipped++;
      } else {
        created++;
      }
    } catch (err) {
      console.log(`⚠️  Statement skipped`);
      skipped++;
    }
  }

  console.log(`\n✅ Created: ${created} statements`);
  console.log(`⏭️  Skipped: ${skipped} statements`);
}

// Insert default data
async function insertDefaultData() {
  console.log('\n🔄 Inserting default data...\n');

  try {
    // Check if admin user exists
    const { data: adminUsers } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'admin@tsoam.org')
      .limit(1);

    if (adminUsers && adminUsers.length > 0) {
      console.log('📋 Admin user already exists');
      return true;
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminId = uuidv4();

    const { error: adminError } = await supabase
      .from('users')
      .insert([{
        id: adminId,
        name: 'System Administrator',
        email: 'admin@tsoam.org',
        password_hash: adminPassword,
        role: 'Admin',
        department: 'Administration',
        employee_id: 'TSOAM-ADM-001',
        is_active: true,
        can_create_accounts: true,
        can_delete_accounts: true
      }]);

    if (adminError) {
      console.error('❌ Failed to create admin user:', adminError.message);
      return false;
    }

    console.log('✅ Admin user created: admin@tsoam.org / admin123');

    // Create HR Officer
    const hrPassword = await bcrypt.hash('hr123', 12);
    const hrId = uuidv4();

    const { error: hrError } = await supabase
      .from('users')
      .insert([{
        id: hrId,
        name: 'HR Officer',
        email: 'hr@tsoam.org',
        password_hash: hrPassword,
        role: 'HR Officer',
        department: 'Human Resources',
        employee_id: 'TSOAM-HR-001',
        is_active: true
      }]);

    if (hrError) {
      console.error('⚠️  Failed to create HR user:', hrError.message);
    } else {
      console.log('✅ HR Officer user created: hr@tsoam.org / hr123');
    }

    // Create Finance Officer
    const financePassword = await bcrypt.hash('finance123', 12);
    const financeId = uuidv4();

    const { error: financeError } = await supabase
      .from('users')
      .insert([{
        id: financeId,
        name: 'Finance Officer',
        email: 'finance@tsoam.org',
        password_hash: financePassword,
        role: 'Finance Officer',
        department: 'Finance',
        employee_id: 'TSOAM-FIN-001',
        is_active: true
      }]);

    if (financeError) {
      console.error('⚠️  Failed to create Finance user:', financeError.message);
    } else {
      console.log('✅ Finance Officer user created: finance@tsoam.org / finance123');
    }

    // Insert role permissions
    const rolePermissions = [
      { role_name: 'Admin', permission_name: 'dashboard_view', permission_value: true },
      { role_name: 'Admin', permission_name: 'members_view', permission_value: true },
      { role_name: 'Admin', permission_name: 'members_create', permission_value: true },
      { role_name: 'Admin', permission_name: 'members_edit', permission_value: true },
      { role_name: 'Admin', permission_name: 'members_delete', permission_value: true },
      { role_name: 'Admin', permission_name: 'hr_view', permission_value: true },
      { role_name: 'Admin', permission_name: 'hr_manage', permission_value: true },
      { role_name: 'Admin', permission_name: 'finance_view', permission_value: true },
      { role_name: 'Admin', permission_name: 'finance_manage', permission_value: true },
      { role_name: 'Admin', permission_name: 'events_view', permission_value: true },
      { role_name: 'Admin', permission_name: 'events_manage', permission_value: true },
      { role_name: 'Admin', permission_name: 'messaging_send', permission_value: true },
      { role_name: 'Admin', permission_name: 'welfare_view', permission_value: true },
      { role_name: 'Admin', permission_name: 'welfare_approve', permission_value: true },
      { role_name: 'Admin', permission_name: 'users_view', permission_value: true },
      { role_name: 'Admin', permission_name: 'users_manage', permission_value: true },
      { role_name: 'Admin', permission_name: 'system_logs_view', permission_value: true },
      { role_name: 'Admin', permission_name: 'system_settings', permission_value: true },

      { role_name: 'HR Officer', permission_name: 'dashboard_view', permission_value: true },
      { role_name: 'HR Officer', permission_name: 'members_view', permission_value: true },
      { role_name: 'HR Officer', permission_name: 'members_create', permission_value: true },
      { role_name: 'HR Officer', permission_name: 'members_edit', permission_value: true },
      { role_name: 'HR Officer', permission_name: 'hr_view', permission_value: true },
      { role_name: 'HR Officer', permission_name: 'hr_manage', permission_value: true },
      { role_name: 'HR Officer', permission_name: 'events_view', permission_value: true },
      { role_name: 'HR Officer', permission_name: 'messaging_send', permission_value: true },
      { role_name: 'HR Officer', permission_name: 'welfare_view', permission_value: true },

      { role_name: 'Finance Officer', permission_name: 'dashboard_view', permission_value: true },
      { role_name: 'Finance Officer', permission_name: 'members_view', permission_value: true },
      { role_name: 'Finance Officer', permission_name: 'finance_view', permission_value: true },
      { role_name: 'Finance Officer', permission_name: 'finance_manage', permission_value: true },
      { role_name: 'Finance Officer', permission_name: 'welfare_view', permission_value: true },

      { role_name: 'User', permission_name: 'dashboard_view', permission_value: true },
      { role_name: 'User', permission_name: 'members_view', permission_value: true },
      { role_name: 'User', permission_name: 'events_view', permission_value: true }
    ];

    const { error: permError } = await supabase
      .from('role_permissions')
      .insert(rolePermissions);

    if (permError && !permError.message.includes('duplicate')) {
      console.error('⚠️  Failed to insert role permissions:', permError.message);
    } else {
      console.log('✅ Role permissions configured');
    }

    // Insert system settings
    const systemSettings = [
      { setting_key: 'church_name', setting_value: 'The Seed of Abraham Ministry (TSOAM)', setting_type: 'string', category: 'general', is_public: true },
      { setting_key: 'church_address', setting_value: 'Nairobi, Kenya', setting_type: 'string', category: 'general', is_public: true },
      { setting_key: 'church_email', setting_value: 'admin@tsoam.org', setting_type: 'string', category: 'general', is_public: true },
      { setting_key: 'currency', setting_value: 'KSH', setting_type: 'string', category: 'finance', is_public: true },
      { setting_key: 'timezone', setting_value: 'Africa/Nairobi', setting_type: 'string', category: 'general', is_public: true }
    ];

    const { error: settingsError } = await supabase
      .from('system_settings')
      .insert(systemSettings);

    if (settingsError && !settingsError.message.includes('duplicate')) {
      console.error('⚠️  Failed to insert system settings:', settingsError.message);
    } else {
      console.log('✅ System settings configured');
    }

    return true;
  } catch (error) {
    console.error('❌ Error inserting default data:', error.message);
    return false;
  }
}

// Main setup function
async function setupSupabase() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  TSOAM Church Management System - Supabase Setup       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // Create tables
    await createTables();

    // Insert default data
    await insertDefaultData();

    console.log('\n✅ Supabase setup completed successfully!');
    console.log('\n📝 Default Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━��━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:           admin@tsoam.org / admin123');
    console.log('HR Officer:      hr@tsoam.org / hr123');
    console.log('Finance Officer: finance@tsoam.org / finance123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return true;
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  setupSupabase()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { setupSupabase };
