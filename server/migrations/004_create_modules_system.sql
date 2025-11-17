-- ============================================================================
-- MODULES SYSTEM - Enable modular architecture for churches
-- ============================================================================

-- ============================================================================
-- 1. MODULES TABLE - Define available modules
-- ============================================================================
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  module_code VARCHAR(50) UNIQUE NOT NULL,
  module_name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) DEFAULT '1.0.0',
  price_usd DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_kes DECIMAL(10, 2) NOT NULL DEFAULT 0,
  billing_cycle VARCHAR(50) DEFAULT 'monthly', -- monthly, annual, one-time
  features TEXT, -- JSON array of feature descriptions
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_modules_code ON modules(module_code);
CREATE INDEX IF NOT EXISTS idx_modules_active ON modules(is_active);

-- ============================================================================
-- 2. CHURCH_SUBSCRIPTIONS TABLE - Track module subscriptions per church
-- ============================================================================
CREATE TABLE IF NOT EXISTS church_subscriptions (
  id SERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  license_key VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, expired, cancelled
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activation_date TIMESTAMP,
  expiration_date TIMESTAMP,
  license_type VARCHAR(50) DEFAULT 'perpetual', -- perpetual, trial, subscription
  max_users INTEGER DEFAULT -1, -- -1 means unlimited
  active_users_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_church_subscriptions_module ON church_subscriptions(module_id);
CREATE INDEX IF NOT EXISTS idx_church_subscriptions_status ON church_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_church_subscriptions_license ON church_subscriptions(license_key);

-- ============================================================================
-- 3. MODULE_FEATURES TABLE - Define features within each module
-- ============================================================================
CREATE TABLE IF NOT EXISTS module_features (
  id SERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  feature_code VARCHAR(100) NOT NULL,
  feature_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT false, -- Required features vs optional add-ons
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(module_id, feature_code)
);

CREATE INDEX IF NOT EXISTS idx_module_features_module ON module_features(module_id);

-- ============================================================================
-- 4. MODULE_ACCESS_LOG TABLE - Audit trail for module access
-- ============================================================================
CREATE TABLE IF NOT EXISTS module_access_log (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- access_granted, access_denied, module_activated, module_deactivated
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_module_access_log_user ON module_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_module_access_log_module ON module_access_log(module_id);
CREATE INDEX IF NOT EXISTS idx_module_access_log_date ON module_access_log(created_at);

-- ============================================================================
-- 5. INSERT AVAILABLE MODULES
-- ============================================================================
INSERT INTO modules (module_code, module_name, description, version, price_usd, price_kes, billing_cycle, features, is_active)
VALUES
(
  'member_management',
  'Member Management',
  'Complete member registration, tracking, and communication system',
  '1.0.0',
  29.99,
  3500,
  'monthly',
  '["Member Registration", "Member Tracking", "Communication", "Reports", "Bulk SMS"]',
  true
),
(
  'finance',
  'Finance & Accounting',
  'Tithe tracking, offering management, expense tracking, and financial reports',
  '1.0.0',
  49.99,
  5800,
  'monthly',
  '["Tithe Tracking", "Offering Management", "Expense Tracking", "Financial Reports", "Budget Planning", "Audit Trail"]',
  true
),
(
  'hr',
  'HR & Payroll',
  'Employee management, attendance tracking, and payroll processing',
  '1.0.0',
  39.99,
  4600,
  'monthly',
  '["Employee Management", "Attendance Tracking", "Payroll Processing", "Leave Management", "Performance Reviews"]',
  true
),
(
  'homecells',
  'HomeCells Management',
  'Organize church into districts, zones, and home cells with hierarchy management',
  '1.0.0',
  24.99,
  2900,
  'monthly',
  '["District Management", "Zone Management", "HomCell Organization", "Leader Assignment", "Reporting"]',
  true
),
(
  'welfare',
  'Welfare & Support',
  'Track member assistance, support requests, and welfare programs',
  '1.0.0',
  19.99,
  2300,
  'monthly',
  '["Assistance Tracking", "Support Requests", "Welfare Programs", "Beneficiary Management"]',
  true
),
(
  'events',
  'Events Management',
  'Plan, organize, and track church events and services',
  '1.0.0',
  19.99,
  2300,
  'monthly',
  '["Event Planning", "Attendance Tracking", "Budget Tracking", "Event Reports"]',
  true
),
(
  'inventory',
  'Inventory Management',
  'Track church assets, equipment, and supplies',
  '1.0.0',
  19.99,
  2300,
  'monthly',
  '["Asset Tracking", "Equipment Management", "Supply Management", "Maintenance Tracking"]',
  true
),
(
  'appointments',
  'Appointments & Scheduling',
  'Schedule and manage pastoral appointments and counseling sessions',
  '1.0.0',
  14.99,
  1700,
  'monthly',
  '["Appointment Scheduling", "Calendar Integration", "Reminder Notifications", "Counseling Logs"]',
  true
)
ON CONFLICT (module_code) DO NOTHING;

-- ============================================================================
-- 6. INSERT MODULE FEATURES
-- ============================================================================
INSERT INTO module_features (module_id, feature_code, feature_name, description, is_required)
SELECT id, 'member_registration', 'Member Registration', 'Register new members into the system', true FROM modules WHERE module_code = 'member_management'
ON CONFLICT (module_id, feature_code) DO NOTHING;

INSERT INTO module_features (module_id, feature_code, feature_name, description, is_required)
SELECT id, 'member_reports', 'Member Reports', 'Generate reports on member statistics', true FROM modules WHERE module_code = 'member_management'
ON CONFLICT (module_id, feature_code) DO NOTHING;

INSERT INTO module_features (module_id, feature_code, feature_name, description, is_required)
SELECT id, 'bulk_messaging', 'Bulk SMS Messaging', 'Send bulk SMS to members', false FROM modules WHERE module_code = 'member_management'
ON CONFLICT (module_id, feature_code) DO NOTHING;

INSERT INTO module_features (module_id, feature_code, feature_name, description, is_required)
SELECT id, 'tithe_tracking', 'Tithe Tracking', 'Track tithes and offerings', true FROM modules WHERE module_code = 'finance'
ON CONFLICT (module_id, feature_code) DO NOTHING;

INSERT INTO module_features (module_id, feature_code, feature_name, description, is_required)
SELECT id, 'expense_tracking', 'Expense Tracking', 'Track church expenses', true FROM modules WHERE module_code = 'finance'
ON CONFLICT (module_id, feature_code) DO NOTHING;

INSERT INTO module_features (module_id, feature_code, feature_name, description, is_required)
SELECT id, 'financial_reports', 'Financial Reports', 'Generate financial reports', true FROM modules WHERE module_code = 'finance'
ON CONFLICT (module_id, feature_code) DO NOTHING;

INSERT INTO module_features (module_id, feature_code, feature_name, description, is_required)
SELECT id, 'budget_planning', 'Budget Planning', 'Plan and track budgets', false FROM modules WHERE module_code = 'finance'
ON CONFLICT (module_id, feature_code) DO NOTHING;

INSERT INTO module_features (module_id, feature_code, feature_name, description, is_required)
SELECT id, 'employee_management', 'Employee Management', 'Manage employee records', true FROM modules WHERE module_code = 'hr'
ON CONFLICT (module_id, feature_code) DO NOTHING;

INSERT INTO module_features (module_id, feature_code, feature_name, description, is_required)
SELECT id, 'attendance_tracking', 'Attendance Tracking', 'Track employee attendance', true FROM modules WHERE module_code = 'hr'
ON CONFLICT (module_id, feature_code) DO NOTHING;

INSERT INTO module_features (module_id, feature_code, feature_name, description, is_required)
SELECT id, 'payroll', 'Payroll Processing', 'Process employee payroll', true FROM modules WHERE module_code = 'hr'
ON CONFLICT (module_id, feature_code) DO NOTHING;

INSERT INTO module_features (module_id, feature_code, feature_name, description, is_required)
SELECT id, 'district_management', 'District Management', 'Manage church districts', true FROM modules WHERE module_code = 'homecells'
ON CONFLICT (module_id, feature_code) DO NOTHING;

INSERT INTO module_features (module_id, feature_code, feature_name, description, is_required)
SELECT id, 'zone_management', 'Zone Management', 'Manage zones within districts', true FROM modules WHERE module_code = 'homecells'
ON CONFLICT (module_id, feature_code) DO NOTHING;

INSERT INTO module_features (module_id, feature_code, feature_name, description, is_required)
SELECT id, 'homecell_organization', 'HomCell Organization', 'Organize and manage home cells', true FROM modules WHERE module_code = 'homecells'
ON CONFLICT (module_id, feature_code) DO NOTHING;
