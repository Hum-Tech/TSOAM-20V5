/**
 * TSOAM Church Management System - Complete Database Schema
 * 
 * This comprehensive migration creates all necessary tables and indexes
 * for the full functionality of the church management system.
 * 
 * Tables Created:
 * - users: Core user authentication and profile management
 * - account_requests: User account registration requests and approval workflow
 * - members: Church member records with comprehensive demographics
 * - transitions: Member transition/onboarding process tracking
 * - tithes: Tithe and offering records
 * - financial_transactions: All financial movement records
 * - welfare_requests: Member welfare and assistance requests
 * - welfare_approvals: Workflow for welfare request approvals
 * - events: Church events and activities
 * - appointments: Meeting and appointment scheduling
 * - homecells: Home cell group organization
 * - homecell_members: Member assignments to home cells
 * - messages: Internal messaging system
 * - system_logs: Audit and activity logging
 * - districts: Geographic district organization
 * - zones: Geographic zones within districts
 * - inventory_items: Church inventory and assets
 * - inventory_categories: Asset categorization
 * - modules: Purchasable system modules
 * - subscriptions: User module subscriptions
 * - password_resets: Password reset request tracking
 * 
 * @version 1.0.0
 * @created 2025-01-17
 * @author ZionSurf Development Team
 */

-- ============================================================================
-- AUTHENTICATION & USER MANAGEMENT
-- ============================================================================

/**
 * Users table - Core authentication and user profile management
 * Stores user credentials, roles, permissions, and personal information
 */
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  department VARCHAR(100),
  employee_id VARCHAR(50),
  profile_picture TEXT,
  address TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  can_create_accounts BOOLEAN DEFAULT FALSE,
  can_delete_accounts BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE
);

/**
 * Account requests table - User registration request workflow
 * Tracks new account requests from potential users and approval status
 */
CREATE TABLE IF NOT EXISTS public.account_requests (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(50) DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT,
  rejection_reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/**
 * Password resets table - Secure password reset token management
 * Tracks password reset requests with expiring tokens
 */
CREATE TABLE IF NOT EXISTS public.password_resets (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MEMBER MANAGEMENT
-- ============================================================================

/**
 * Members table - Church member records with comprehensive demographics
 * Central registry of all church members with personal and membership information
 */
CREATE TABLE IF NOT EXISTS public.members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  member_id VARCHAR(50) UNIQUE NOT NULL,
  tithe_number VARCHAR(50),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  phone_number VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(20),
  marital_status VARCHAR(50),
  address TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  home_cell VARCHAR(255),
  homecell_id BIGINT REFERENCES public.homecells(id) ON DELETE SET NULL,
  membership_status VARCHAR(50) DEFAULT 'Active',
  year_of_joining INTEGER,
  visit_date DATE,
  membership_date DATE,
  baptized BOOLEAN DEFAULT FALSE,
  baptism_date DATE,
  bible_study_completed BOOLEAN DEFAULT FALSE,
  bible_study_completion_date DATE,
  employment_status VARCHAR(50),
  previous_church_name VARCHAR(255),
  reason_for_leaving_previous_church VARCHAR(100),
  reason_details TEXT,
  how_heard_about_us VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/**
 * Transitions table - Member transition/onboarding process tracking
 * Tracks the progression of new members through onboarding workflows
 */
CREATE TABLE IF NOT EXISTS public.transitions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  member_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  transition_stage VARCHAR(100) NOT NULL,
  stage_status VARCHAR(50) DEFAULT 'Pending',
  expected_completion_date DATE,
  actual_completion_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FINANCIAL MANAGEMENT
-- ============================================================================

/**
 * Tithes table - Tithe and offering collection records
 * Stores all tithe and offering transactions for financial tracking
 */
CREATE TABLE IF NOT EXISTS public.tithes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  member_id TEXT REFERENCES public.members(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'KES',
  payment_method VARCHAR(50),
  payment_date DATE NOT NULL,
  month INTEGER,
  year INTEGER,
  notes TEXT,
  recorded_by VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/**
 * Financial transactions table - Comprehensive financial movement records
 * Central ledger for all church financial transactions (income and expenses)
 */
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  transaction_id VARCHAR(50) UNIQUE NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'KES',
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  payment_method VARCHAR(50),
  transaction_date DATE NOT NULL,
  recorded_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  description TEXT,
  reference_id VARCHAR(100),
  member_id TEXT REFERENCES public.members(id) ON DELETE SET NULL,
  recorded_by VARCHAR(255),
  approved_by VARCHAR(255),
  approval_date DATE,
  is_approved BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- WELFARE & ASSISTANCE
-- ============================================================================

/**
 * Welfare requests table - Member welfare and assistance requests
 * Tracks requests for church assistance and welfare support
 */
CREATE TABLE IF NOT EXISTS public.welfare_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  request_id VARCHAR(50) UNIQUE NOT NULL,
  member_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  request_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  urgency_level VARCHAR(50) DEFAULT 'Normal',
  status VARCHAR(50) DEFAULT 'Pending',
  requested_date DATE DEFAULT CURRENT_DATE,
  response_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/**
 * Welfare approvals table - Workflow for welfare request approvals
 * Tracks the approval process and decisions for welfare requests
 */
CREATE TABLE IF NOT EXISTS public.welfare_approvals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  request_id TEXT NOT NULL REFERENCES public.welfare_requests(id) ON DELETE CASCADE,
  approver_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  comments TEXT,
  action_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- EVENTS & SCHEDULING
-- ============================================================================

/**
 * Events table - Church events and activities
 * Manages church events, services, and scheduled activities
 */
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  organizer_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  attendance_required BOOLEAN DEFAULT FALSE,
  expected_attendance INTEGER,
  actual_attendance INTEGER,
  status VARCHAR(50) DEFAULT 'Scheduled',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/**
 * Appointments table - Meeting and appointment scheduling
 * Tracks one-on-one meetings and appointments
 */
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  appointment_type VARCHAR(100),
  appointed_with TEXT,
  appointed_with_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  requested_by_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Scheduled',
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- HOME CELLS & ORGANIZATION
-- ============================================================================

/**
 * Districts table - Geographic district organization
 * Top-level organizational structure for church districts
 */
CREATE TABLE IF NOT EXISTS public.districts (
  id BIGSERIAL PRIMARY KEY,
  district_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  leader_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/**
 * Zones table - Geographic zones within districts
 * Subdivisions within districts for organizational purposes
 */
CREATE TABLE IF NOT EXISTS public.zones (
  id BIGSERIAL PRIMARY KEY,
  zone_id VARCHAR(100) UNIQUE NOT NULL,
  district_id BIGINT NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  leader_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/**
 * Homecells table - Home cell group organization
 * Smallest unit of church organization - small group gatherings
 */
CREATE TABLE IF NOT EXISTS public.homecells (
  id BIGSERIAL PRIMARY KEY,
  homecell_id VARCHAR(100) UNIQUE NOT NULL,
  zone_id BIGINT NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  district_id BIGINT NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  leader_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  meeting_day VARCHAR(50),
  meeting_time TIME,
  meeting_location VARCHAR(255),
  member_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/**
 * Homecell members table - Member assignments to home cells
 * Tracks which members are assigned to which home cells
 */
CREATE TABLE IF NOT EXISTS public.homecell_members (
  id BIGSERIAL PRIMARY KEY,
  homecell_id BIGINT NOT NULL REFERENCES public.homecells(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(homecell_id, member_id)
);

-- ============================================================================
-- COMMUNICATION
-- ============================================================================

/**
 * Messages table - Internal messaging system
 * Handles internal communication between system users
 */
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sender_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_ids TEXT[] NOT NULL,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'internal',
  status VARCHAR(50) DEFAULT 'sent',
  read_by TEXT[] DEFAULT ARRAY[]::text[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SYSTEM & ADMINISTRATION
-- ============================================================================

/**
 * System logs table - Audit and activity logging
 * Comprehensive audit trail of all system activities and changes
 */
CREATE TABLE IF NOT EXISTS public.system_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  log_id VARCHAR(100) UNIQUE NOT NULL,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  module VARCHAR(100),
  entity_type VARCHAR(100),
  entity_id VARCHAR(100),
  severity VARCHAR(20) DEFAULT 'Info',
  details JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/**
 * Inventory items table - Church inventory and assets
 * Tracks church property and inventory
 */
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  item_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id TEXT REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
  quantity_in_stock INT DEFAULT 0,
  unit_of_measure VARCHAR(50),
  unit_cost DECIMAL(10, 2),
  total_value DECIMAL(12, 2),
  reorder_level INT DEFAULT 5,
  supplier VARCHAR(255),
  location VARCHAR(255),
  purchase_date DATE,
  warranty_expiry DATE,
  condition VARCHAR(50) DEFAULT 'Good',
  status VARCHAR(50) DEFAULT 'Active',
  last_checked_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/**
 * Inventory categories table - Asset categorization
 * Standard categories for inventory classification
 */
CREATE TABLE IF NOT EXISTS public.inventory_categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MODULES & SUBSCRIPTIONS
-- ============================================================================

/**
 * Modules table - Purchasable system modules
 * Defines available modules that can be activated by users
 */
CREATE TABLE IF NOT EXISTS public.modules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  module_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) DEFAULT '1.0.0',
  status VARCHAR(50) DEFAULT 'available',
  pricing DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/**
 * Subscriptions table - User module subscriptions
 * Tracks active module subscriptions for users
 */
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  subscription_type VARCHAR(50) DEFAULT 'monthly',
  status VARCHAR(50) DEFAULT 'active',
  start_date DATE NOT NULL,
  end_date DATE,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, module_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- Account request indexes
CREATE INDEX IF NOT EXISTS idx_account_requests_status ON public.account_requests(status);
CREATE INDEX IF NOT EXISTS idx_account_requests_email ON public.account_requests(email);
CREATE INDEX IF NOT EXISTS idx_account_requests_created_at ON public.account_requests(created_at DESC);

-- Member indexes
CREATE INDEX IF NOT EXISTS idx_members_member_id ON public.members(member_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email);
CREATE INDEX IF NOT EXISTS idx_members_membership_status ON public.members(membership_status);
CREATE INDEX IF NOT EXISTS idx_members_is_active ON public.members(is_active);
CREATE INDEX IF NOT EXISTS idx_members_homecell ON public.members(homecell_id);

-- Financial indexes
CREATE INDEX IF NOT EXISTS idx_tithes_member_id ON public.tithes(member_id);
CREATE INDEX IF NOT EXISTS idx_tithes_payment_date ON public.tithes(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON public.financial_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_member ON public.financial_transactions(member_id);

-- District/Zone/Homecell indexes
CREATE INDEX IF NOT EXISTS idx_districts_is_active ON public.districts(is_active);
CREATE INDEX IF NOT EXISTS idx_zones_district_id ON public.zones(district_id);
CREATE INDEX IF NOT EXISTS idx_homecells_zone_id ON public.homecells(zone_id);
CREATE INDEX IF NOT EXISTS idx_homecells_district_id ON public.homecells(district_id);
CREATE INDEX IF NOT EXISTS idx_homecell_members_homecell_id ON public.homecell_members(homecell_id);

-- Event and appointment indexes
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date DESC);

-- System logs index
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON public.system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id);

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
