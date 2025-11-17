-- ============================================================================
-- TSOAM Church Management System - Complete Database Schema
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE - Core user accounts
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL DEFAULT 'user', -- admin, pastor, user, finance_officer, hr_officer
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for email lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- ============================================================================
-- 2. ROLE PERMISSIONS TABLE - Define what each role can access
-- ============================================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL,
  permission VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role, permission)
);

-- Insert default role permissions
DELETE FROM role_permissions;

-- Admin - Access everything
INSERT INTO role_permissions (role, permission) VALUES
('admin', 'dashboard.view'),
('admin', 'dashboard.full'),
('admin', 'new_members.manage'),
('admin', 'members.manage'),
('admin', 'finance.manage'),
('admin', 'finance.view'),
('admin', 'hr.manage'),
('admin', 'hr.view'),
('admin', 'welfare.manage'),
('admin', 'welfare.view'),
('admin', 'inventory.manage'),
('admin', 'inventory.view'),
('admin', 'events.manage'),
('admin', 'events.view'),
('admin', 'appointments.manage'),
('admin', 'appointments.view'),
('admin', 'messaging.send'),
('admin', 'messaging.view'),
('admin', 'settings.manage'),
('admin', 'users.manage');

-- Pastor - Access everything
INSERT INTO role_permissions (role, permission) VALUES
('pastor', 'dashboard.view'),
('pastor', 'dashboard.full'),
('pastor', 'new_members.manage'),
('pastor', 'members.manage'),
('pastor', 'finance.manage'),
('pastor', 'finance.view'),
('pastor', 'hr.manage'),
('pastor', 'hr.view'),
('pastor', 'welfare.manage'),
('pastor', 'welfare.view'),
('pastor', 'inventory.manage'),
('pastor', 'inventory.view'),
('pastor', 'events.manage'),
('pastor', 'events.view'),
('pastor', 'appointments.manage'),
('pastor', 'appointments.view'),
('pastor', 'messaging.send'),
('pastor', 'messaging.view'),
('pastor', 'settings.manage');

-- User - Limited access
INSERT INTO role_permissions (role, permission) VALUES
('user', 'dashboard.view'),
('user', 'new_members.view'),
('user', 'new_members.create'),
('user', 'members.view'),
('user', 'welfare.view'),
('user', 'welfare.manage'),
('user', 'inventory.view'),
('user', 'inventory.limited'),
('user', 'events.view'),
('user', 'messaging.send'),
('user', 'messaging.view'),
('user', 'settings.view.limited');

-- Finance Officer
INSERT INTO role_permissions (role, permission) VALUES
('finance_officer', 'dashboard.view'),
('finance_officer', 'dashboard.finance'),
('finance_officer', 'finance.manage'),
('finance_officer', 'finance.view'),
('finance_officer', 'events.view'),
('finance_officer', 'messaging.send'),
('finance_officer', 'messaging.view'),
('finance_officer', 'settings.view.finance');

-- HR Officer
INSERT INTO role_permissions (role, permission) VALUES
('hr_officer', 'dashboard.view'),
('hr_officer', 'dashboard.hr'),
('hr_officer', 'messaging.send'),
('hr_officer', 'messaging.view'),
('hr_officer', 'inventory.view'),
('hr_officer', 'inventory.manage'),
('hr_officer', 'appointments.manage'),
('hr_officer', 'appointments.view'),
('hr_officer', 'welfare.view'),
('hr_officer', 'welfare.manage'),
('hr_officer', 'hr.manage'),
('hr_officer', 'hr.view'),
('hr_officer', 'events.view'),
('hr_officer', 'settings.view.hr');

-- ============================================================================
-- 3. DISTRICTS TABLE
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

-- ============================================================================
-- 4. ZONES TABLE
-- ============================================================================
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

-- ============================================================================
-- 5. HOMECELLS TABLE
-- ============================================================================
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
-- 6. MEMBERS TABLE
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
  homecell_id INTEGER REFERENCES homecells(id),
  membership_status VARCHAR(50) DEFAULT 'Active', -- Active, Inactive
  year_of_joining INTEGER,
  visit_date DATE,
  membership_date DATE,
  baptized BOOLEAN DEFAULT false,
  baptism_date DATE,
  bible_study_completed BOOLEAN DEFAULT false,
  bible_study_completion_date DATE,
  employment_status VARCHAR(50),
  born_again BOOLEAN DEFAULT false,
  service_groups TEXT, -- JSON array
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
CREATE INDEX IF NOT EXISTS idx_members_homecell ON members(homecell_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(membership_status);

-- ============================================================================
-- 7. FINANCIAL TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type VARCHAR(50) NOT NULL, -- income, expense, tithe, offering
  category VARCHAR(100),
  description TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'KES',
  member_id UUID REFERENCES members(id),
  recorded_by UUID REFERENCES users(id),
  transaction_date DATE,
  payment_method VARCHAR(50), -- cash, bank_transfer, mobile_money
  reference_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'completed', -- pending, completed, cancelled
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_member ON financial_transactions(member_id);

-- ============================================================================
-- 8. INVENTORY TABLE
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
-- 9. WELFARE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS welfare (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id),
  type VARCHAR(100), -- assistance, support, prayer_request
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, completed
  amount DECIMAL(12, 2),
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_welfare_member ON welfare(member_id);
CREATE INDEX IF NOT EXISTS idx_welfare_status ON welfare(status);

-- ============================================================================
-- 10. APPOINTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  appointment_date TIMESTAMP,
  duration_minutes INTEGER,
  attendee_type VARCHAR(50), -- member, staff, other
  attendee_id UUID,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled
  location VARCHAR(255),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- ============================================================================
-- 11. CHURCH EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS church_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(255) NOT NULL,
  description TEXT,
  event_date TIMESTAMP,
  end_date TIMESTAMP,
  location VARCHAR(255),
  event_type VARCHAR(100), -- service, meeting, celebration, workshop
  expected_attendance INTEGER,
  actual_attendance INTEGER,
  organizer_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_date ON church_events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON church_events(status);

-- ============================================================================
-- 12. MESSAGES TABLE
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
-- 13. SYSTEM LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255),
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  changes TEXT, -- JSON
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logs_user ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_date ON system_logs(created_at);

-- ============================================================================
-- 14. DISTRICTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS districts (
  id BIGSERIAL PRIMARY KEY,
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

-- ============================================================================
-- 15. ZONES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS zones (
  id BIGSERIAL PRIMARY KEY,
  zone_id VARCHAR(50) UNIQUE,
  district_id BIGINT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
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

-- ============================================================================
-- 16. HOMECELLS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS homecells (
  id BIGSERIAL PRIMARY KEY,
  homecell_id VARCHAR(50) UNIQUE,
  zone_id BIGINT NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  district_id BIGINT REFERENCES districts(id) ON DELETE SET NULL,
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
-- 17. INSERT SAMPLE DATA
-- ============================================================================

-- Districts
INSERT INTO districts (name, description, is_active) VALUES
('Nairobi Central', 'Central Nairobi area', true),
('Nairobi East', 'East Nairobi area', true),
('Nairobi West', 'West Nairobi area', true)
ON CONFLICT (district_id) DO NOTHING;

-- Zones (for each district)
INSERT INTO zones (district_id, name, leader, leader_phone, is_active) VALUES
(1, 'Zone A1', 'John Mwangi', '+254712345678', true),
(1, 'Zone A2', 'Mary Kipchoge', '+254712345679', true),
(2, 'Zone B1', 'Peter Okonkwo', '+254712345680', true),
(3, 'Zone C1', 'Grace Nyambura', '+254712345681', true)
ON CONFLICT (zone_id) DO NOTHING;

-- Homecells (for each zone)
INSERT INTO homecells (zone_id, name, leader, leader_phone, meeting_day, meeting_time, meeting_location, is_active) VALUES
(1, 'Zion', 'David Kipchoge', '+254722345678', 'Wednesday', '6:00 PM', 'Riverside Community', true),
(1, 'Judah', 'Ruth Mwangi', '+254722345679', 'Thursday', '5:30 PM', 'Kilimani District', true),
(2, 'Bethel', 'Samuel Okonkwo', '+254722345680', 'Tuesday', '7:00 PM', 'Kasarani Area', true),
(3, 'Philistine', 'Joyce Nyambura', '+254722345681', 'Wednesday', '6:30 PM', 'Westlands Center', true)
ON CONFLICT (homecell_id) DO NOTHING;

-- Create admin user (you'll need to update password)
DELETE FROM users WHERE email = 'admin@tsoam.org';
INSERT INTO users (email, password_hash, full_name, phone, role, is_active) VALUES
('admin@tsoam.org', '$2b$10$YourHashedPasswordHere', 'System Administrator', '+254712000000', 'admin', true);

-- Create sample users for different roles
INSERT INTO users (email, password_hash, full_name, phone, role, is_active) VALUES
('pastor@tsoam.org', '$2b$10$YourHashedPasswordHere', 'Rev. Peter Kipchoge', '+254712111111', 'pastor', true),
('finance@tsoam.org', '$2b$10$YourHashedPasswordHere', 'David Mwangi', '+254712222222', 'finance_officer', true),
('hr@tsoam.org', '$2b$10$YourHashedPasswordHere', 'Sarah Kipchoge', '+254712333333', 'hr_officer', true),
('user@tsoam.org', '$2b$10$YourHashedPasswordHere', 'John Kipchoge', '+254712444444', 'user', true);

-- ============================================================================
-- 15. ENABLE RLS (Row Level Security) - Optional but recommended
-- ============================================================================
-- Uncomment if you want to use RLS policies
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
