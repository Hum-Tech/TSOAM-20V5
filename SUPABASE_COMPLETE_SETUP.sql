-- ============================================================================
-- TSOAM Church Management System - COMPLETE DATABASE SETUP
-- For New Supabase Account
-- ============================================================================
-- 1. Copy this entire file
-- 2. Go to https://app.supabase.com/project/teozbfjxarbpltfrguxe/sql/new
-- 3. Paste all content and run

-- ============================================================================
-- 1. USERS TABLE - Core user accounts
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- ============================================================================
-- 2. ROLE PERMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL,
  permission VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role, permission)
);

-- ============================================================================
-- 3. MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id VARCHAR(50) UNIQUE NOT NULL,
  tithe_number VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(10),
  marital_status VARCHAR(50),
  address TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  homecell_id INTEGER,
  membership_status VARCHAR(50) DEFAULT 'Active',
  year_of_joining INTEGER,
  visit_date DATE,
  membership_date DATE,
  baptized BOOLEAN DEFAULT false,
  baptism_date DATE,
  bible_study_completed BOOLEAN DEFAULT false,
  bible_study_completion_date DATE,
  employment_status VARCHAR(50),
  born_again BOOLEAN DEFAULT false,
  service_groups TEXT,
  previous_church_name VARCHAR(255),
  reason_for_leaving_previous_church VARCHAR(100),
  reason_details TEXT,
  how_heard_about_us VARCHAR(100),
  church_feedback TEXT,
  prayer_requests TEXT,
  transferred_from_new_member_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(membership_status);

-- ============================================================================
-- 4. EMPLOYEES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(10),
  marital_status VARCHAR(50),
  address TEXT,
  employment_date DATE,
  job_title VARCHAR(100),
  department VARCHAR(100),
  salary DECIMAL(12, 2),
  employment_status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(employment_status);

-- ============================================================================
-- 5. FINANCIAL TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'KES',
  member_id UUID REFERENCES members(id),
  recorded_by UUID REFERENCES users(id),
  transaction_date DATE,
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_member ON financial_transactions(member_id);

-- ============================================================================
-- 6. INVENTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  quantity INTEGER,
  unit VARCHAR(50),
  location VARCHAR(255),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. WELFARE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS welfare (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id),
  type VARCHAR(100),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  amount DECIMAL(12, 2),
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_welfare_member ON welfare(member_id);
CREATE INDEX IF NOT EXISTS idx_welfare_status ON welfare(status);

-- ============================================================================
-- 8. APPOINTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  appointment_date TIMESTAMP,
  duration_minutes INTEGER,
  attendee_type VARCHAR(50),
  attendee_id UUID,
  status VARCHAR(50) DEFAULT 'scheduled',
  location VARCHAR(255),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- ============================================================================
-- 9. CHURCH EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS church_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(255) NOT NULL,
  description TEXT,
  event_date TIMESTAMP,
  end_date TIMESTAMP,
  location VARCHAR(255),
  event_type VARCHAR(100),
  expected_attendance INTEGER,
  actual_attendance INTEGER,
  organizer_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_date ON church_events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON church_events(status);

-- ============================================================================
-- 10. MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  subject VARCHAR(255),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(is_read);

-- ============================================================================
-- 11. SYSTEM LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255),
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  changes TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logs_user ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_date ON system_logs(created_at);

-- ============================================================================
-- 12. HOMECELLS TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS districts (
  id SERIAL PRIMARY KEY,
  district_id VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_districts_active ON districts(is_active);
CREATE INDEX IF NOT EXISTS idx_districts_leader ON districts(leader_id);

CREATE TABLE IF NOT EXISTS zones (
  id SERIAL PRIMARY KEY,
  zone_id VARCHAR(50) UNIQUE,
  district_id INTEGER NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES users(id),
  leader VARCHAR(255),
  leader_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_zones_district ON zones(district_id);
CREATE INDEX IF NOT EXISTS idx_zones_leader ON zones(leader_id);
CREATE INDEX IF NOT EXISTS idx_zones_active ON zones(is_active);

CREATE TABLE IF NOT EXISTS homecells (
  id SERIAL PRIMARY KEY,
  homecell_id VARCHAR(50) UNIQUE,
  zone_id INTEGER NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES users(id),
  leader VARCHAR(255),
  leader_phone VARCHAR(20),
  meeting_day VARCHAR(20),
  meeting_time VARCHAR(10),
  meeting_location VARCHAR(255),
  member_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_homecells_zone ON homecells(zone_id);
CREATE INDEX IF NOT EXISTS idx_homecells_district ON homecells(district_id);
CREATE INDEX IF NOT EXISTS idx_homecells_leader ON homecells(leader_id);
CREATE INDEX IF NOT EXISTS idx_homecells_active ON homecells(is_active);

-- ============================================================================
-- 13. MODULE SYSTEM TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  module_code VARCHAR(50) UNIQUE NOT NULL,
  module_name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) DEFAULT '1.0.0',
  price_usd DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_kes DECIMAL(10, 2) NOT NULL DEFAULT 0,
  billing_cycle VARCHAR(50) DEFAULT 'monthly',
  features TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_modules_code ON modules(module_code);
CREATE INDEX IF NOT EXISTS idx_modules_active ON modules(is_active);

CREATE TABLE IF NOT EXISTS church_subscriptions (
  id SERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  license_key VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'active',
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activation_date TIMESTAMP,
  expiration_date TIMESTAMP,
  license_type VARCHAR(50) DEFAULT 'perpetual',
  max_users INTEGER DEFAULT -1,
  active_users_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_church_subscriptions_module ON church_subscriptions(module_id);
CREATE INDEX IF NOT EXISTS idx_church_subscriptions_status ON church_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_church_subscriptions_license ON church_subscriptions(license_key);

CREATE TABLE IF NOT EXISTS module_features (
  id SERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  feature_code VARCHAR(100) NOT NULL,
  feature_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(module_id, feature_code)
);

CREATE INDEX IF NOT EXISTS idx_module_features_module ON module_features(module_id);

CREATE TABLE IF NOT EXISTS module_access_log (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_module_access_log_user ON module_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_module_access_log_module ON module_access_log(module_id);
CREATE INDEX IF NOT EXISTS idx_module_access_log_date ON module_access_log(created_at);

-- ============================================================================
-- 14. SEED INITIAL DATA - ROLE PERMISSIONS
-- ============================================================================
DELETE FROM role_permissions;

INSERT INTO role_permissions (role, permission) VALUES
('admin', 'dashboard.view'), ('admin', 'dashboard.full'), ('admin', 'new_members.manage'),
('admin', 'members.manage'), ('admin', 'finance.manage'), ('admin', 'finance.view'),
('admin', 'hr.manage'), ('admin', 'hr.view'), ('admin', 'welfare.manage'), ('admin', 'welfare.view'),
('admin', 'inventory.manage'), ('admin', 'inventory.view'), ('admin', 'events.manage'),
('admin', 'events.view'), ('admin', 'appointments.manage'), ('admin', 'appointments.view'),
('admin', 'messaging.send'), ('admin', 'messaging.view'), ('admin', 'settings.manage'),
('admin', 'users.manage'),
('pastor', 'dashboard.view'), ('pastor', 'dashboard.full'), ('pastor', 'new_members.manage'),
('pastor', 'members.manage'), ('pastor', 'finance.manage'), ('pastor', 'finance.view'),
('pastor', 'hr.manage'), ('pastor', 'hr.view'), ('pastor', 'welfare.manage'), ('pastor', 'welfare.view'),
('pastor', 'inventory.manage'), ('pastor', 'inventory.view'), ('pastor', 'events.manage'),
('pastor', 'events.view'), ('pastor', 'appointments.manage'), ('pastor', 'appointments.view'),
('pastor', 'messaging.send'), ('pastor', 'messaging.view'), ('pastor', 'settings.manage'),
('user', 'dashboard.view'), ('user', 'new_members.view'), ('user', 'new_members.create'),
('user', 'members.view'), ('user', 'welfare.view'), ('user', 'welfare.manage'),
('user', 'inventory.view'), ('user', 'inventory.limited'), ('user', 'events.view'),
('user', 'messaging.send'), ('user', 'messaging.view'), ('user', 'settings.view.limited'),
('finance_officer', 'dashboard.view'), ('finance_officer', 'dashboard.finance'),
('finance_officer', 'finance.manage'), ('finance_officer', 'finance.view'),
('finance_officer', 'events.view'), ('finance_officer', 'messaging.send'),
('finance_officer', 'messaging.view'), ('finance_officer', 'settings.view.finance'),
('hr_officer', 'dashboard.view'), ('hr_officer', 'dashboard.hr'),
('hr_officer', 'messaging.send'), ('hr_officer', 'messaging.view'),
('hr_officer', 'inventory.view'), ('hr_officer', 'inventory.manage'),
('hr_officer', 'appointments.manage'), ('hr_officer', 'appointments.view'),
('hr_officer', 'welfare.view'), ('hr_officer', 'welfare.manage'),
('hr_officer', 'hr.manage'), ('hr_officer', 'hr.view'),
('hr_officer', 'events.view'), ('hr_officer', 'settings.view.hr');

-- ============================================================================
-- 15. SEED DISTRICTS
-- ============================================================================
INSERT INTO districts (district_id, name, description, is_active)
VALUES
  ('DIS-NAIROBI-CENTRAL', 'Nairobi Central', 'Central Nairobi district covering CBD and surrounding areas', TRUE),
  ('DIS-EASTLANDS', 'Eastlands', 'Eastlands district covering Buruburu, Umoja, Donholm, and surrounding areas', TRUE),
  ('DIS-THIKA-ROAD', 'Thika Road', 'Thika Road district covering Zimmerman, Kahawa, Roysambu, and surrounding areas', TRUE),
  ('DIS-SOUTH-NAIROBI', 'South Nairobi', 'South Nairobi district covering Lang''ata, Karen, South C/B, and surrounding areas', TRUE),
  ('DIS-WEST-NAIROBI', 'West Nairobi', 'West Nairobi district covering Kangemi, Uthiru, Dagoretti, and surrounding areas', TRUE),
  ('DIS-NORTH-NAIROBI', 'Northern Nairobi', 'Northern Nairobi district covering Muthaiga, Runda, Gigiri, and surrounding areas', TRUE),
  ('DIS-EAST-NAIROBI', 'Eastern Nairobi', 'Eastern Nairobi district covering Mathare, Huruma, Kariobangi, Dandora, and surrounding areas', TRUE),
  ('DIS-SOUTH-EAST-NAIROBI', 'South East Nairobi', 'South East Nairobi district covering Industrial Area, Mukuru, Imara Daima, and surrounding areas', TRUE),
  ('DIS-OUTSKIRTS-NAIROBI', 'Outskirts Nairobi', 'Outskirts Nairobi district covering Kitengela, Rongai, Ngong, Ruai, Juja, Thika, and surrounding areas', TRUE)
ON CONFLICT (district_id) DO NOTHING;

-- ============================================================================
-- 16. SEED SAMPLE ZONES
-- ============================================================================
INSERT INTO zones (district_id, name, leader, leader_phone, is_active) VALUES
(1, 'Zone A1', 'John Mwangi', '+254712345678', true),
(1, 'Zone A2', 'Mary Kipchoge', '+254712345679', true),
(2, 'Zone B1', 'Peter Okonkwo', '+254712345680', true),
(3, 'Zone C1', 'Grace Nyambura', '+254712345681', true)
ON CONFLICT (zone_id) DO NOTHING;

-- ============================================================================
-- 17. SEED SAMPLE HOMECELLS
-- ============================================================================
INSERT INTO homecells (zone_id, name, leader, leader_phone, meeting_day, meeting_time, meeting_location, is_active) VALUES
(1, 'Zion', 'David Kipchoge', '+254722345678', 'Wednesday', '6:00 PM', 'Riverside Community', true),
(1, 'Judah', 'Ruth Mwangi', '+254722345679', 'Thursday', '5:30 PM', 'Kilimani District', true),
(2, 'Bethel', 'Samuel Okonkwo', '+254722345680', 'Tuesday', '7:00 PM', 'Kasarani Area', true),
(3, 'Philistine', 'Joyce Nyambura', '+254722345681', 'Wednesday', '6:30 PM', 'Westlands Center', true)
ON CONFLICT (homecell_id) DO NOTHING;

-- ============================================================================
-- 18. SEED MODULES
-- ============================================================================
INSERT INTO modules (module_code, module_name, description, version, price_usd, price_kes, billing_cycle, features, is_active) VALUES
('member_management', 'Member Management', 'Complete member registration, tracking, and communication system', '1.0.0', 29.99, 3500, 'monthly', '["Member Registration", "Member Tracking", "Communication", "Reports", "Bulk SMS"]', true),
('finance', 'Finance & Accounting', 'Tithe tracking, offering management, expense tracking, and financial reports', '1.0.0', 49.99, 5800, 'monthly', '["Tithe Tracking", "Offering Management", "Expense Tracking", "Financial Reports", "Budget Planning", "Audit Trail"]', true),
('hr', 'HR & Payroll', 'Employee management, attendance tracking, and payroll processing', '1.0.0', 39.99, 4600, 'monthly', '["Employee Management", "Attendance Tracking", "Payroll Processing", "Leave Management", "Performance Reviews"]', true),
('homecells', 'HomeCells Management', 'Organize church into districts, zones, and home cells with hierarchy management', '1.0.0', 24.99, 2900, 'monthly', '["District Management", "Zone Management", "HomCell Organization", "Leader Assignment", "Reporting"]', true),
('welfare', 'Welfare & Support', 'Track member assistance, support requests, and welfare programs', '1.0.0', 19.99, 2300, 'monthly', '["Assistance Tracking", "Support Requests", "Welfare Programs", "Beneficiary Management"]', true),
('events', 'Events Management', 'Plan, organize, and track church events and services', '1.0.0', 19.99, 2300, 'monthly', '["Event Planning", "Attendance Tracking", "Budget Tracking", "Event Reports"]', true),
('inventory', 'Inventory Management', 'Track church assets, equipment, and supplies', '1.0.0', 19.99, 2300, 'monthly', '["Asset Tracking", "Equipment Management", "Supply Management", "Maintenance Tracking"]', true),
('appointments', 'Appointments & Scheduling', 'Schedule and manage pastoral appointments and counseling sessions', '1.0.0', 14.99, 1700, 'monthly', '["Appointment Scheduling", "Calendar Integration", "Reminder Notifications", "Counseling Logs"]', true)
ON CONFLICT (module_code) DO NOTHING;

-- ============================================================================
-- Setup Complete!
-- ============================================================================
-- All tables have been created successfully.
-- You can now:
-- 1. Create your admin user via API POST /api/auth/bootstrap
-- 2. Or manually insert a user in the users table
-- 3. Start using the system!
