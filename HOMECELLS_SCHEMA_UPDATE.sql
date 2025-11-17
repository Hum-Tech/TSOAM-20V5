-- ============================================================================
-- HOMECELLS SCHEMA UPDATE
-- Adding missing columns for enhanced functionality
-- ============================================================================

-- Add missing columns to zones table
ALTER TABLE zones ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add missing columns to homecells table
ALTER TABLE homecells ADD COLUMN IF NOT EXISTS district_id INTEGER REFERENCES districts(id);
ALTER TABLE homecells ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE homecells ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for district_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_homecells_district ON homecells(district_id);

-- ============================================================================
-- MEMBER MANAGEMENT ENHANCEMENTS
-- ============================================================================

-- Ensure members table has homecell_id column with proper constraint
ALTER TABLE members ADD COLUMN IF NOT EXISTS homecell_id INTEGER REFERENCES homecells(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_members_homecell ON members(homecell_id);
CREATE INDEX IF NOT EXISTS idx_members_membership_status ON members(membership_status);

-- ============================================================================
-- HOMECELL ANALYTICS SUPPORT TABLES (Optional - for future analytics)
-- ============================================================================

-- Create table for tracking attendance if needed
CREATE TABLE IF NOT EXISTS homecell_attendance (
  id SERIAL PRIMARY KEY,
  homecell_id INTEGER NOT NULL REFERENCES homecells(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  present BOOLEAN DEFAULT true,
  notes TEXT,
  recorded_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(homecell_id, member_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_homecell ON homecell_attendance(homecell_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON homecell_attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON homecell_attendance(attendance_date);

-- Create table for tracking homecell activities/events
CREATE TABLE IF NOT EXISTS homecell_activities (
  id SERIAL PRIMARY KEY,
  homecell_id INTEGER NOT NULL REFERENCES homecells(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  location VARCHAR(255),
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activities_homecell ON homecell_activities(homecell_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON homecell_activities(scheduled_date);

-- ============================================================================
-- REPORTING TABLES
-- ============================================================================

-- Create table for storing generated reports
CREATE TABLE IF NOT EXISTS homecell_reports (
  id SERIAL PRIMARY KEY,
  homecell_id INTEGER NOT NULL REFERENCES homecells(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL, -- 'membership', 'attendance', 'financial', etc.
  report_data JSONB NOT NULL,
  generated_by VARCHAR(255),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  report_period_start DATE,
  report_period_end DATE
);

CREATE INDEX IF NOT EXISTS idx_reports_homecell ON homecell_reports(homecell_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON homecell_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_date ON homecell_reports(generated_at);
