# Database Migration Guide

## Problem
The application requires the following tables to function:
- `districts` - for managing church districts
- `zones` - for managing zones within districts
- `homecells` - for managing home cells within zones
- `homecell_members` - for managing member assignments to home cells

These tables are missing from your Supabase database.

## Solution

### Option 1: Apply Migrations via Supabase Dashboard (RECOMMENDED)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/
2. Click on "SQL Editor" in the left sidebar
3. Click "+ New Query"
4. Copy and paste the SQL from below
5. Click "Run"

#### SQL to Apply

```sql
-- ============================================================================
-- HOMECELLS SYSTEM TABLES
-- ============================================================================

-- Create districts table
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

-- Create zones table
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

-- Create homecells table
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

-- Create homecell_members table for tracking member assignments
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

-- Create homecell_attendance table
CREATE TABLE IF NOT EXISTS public.homecell_attendance (
  id BIGSERIAL PRIMARY KEY,
  homecell_id BIGINT NOT NULL REFERENCES public.homecells(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL,
  attendance_date DATE NOT NULL,
  present BOOLEAN DEFAULT true,
  notes TEXT,
  recorded_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(homecell_id, member_id, attendance_date)
);

-- Create homecell_activities table
CREATE TABLE IF NOT EXISTS public.homecell_activities (
  id BIGSERIAL PRIMARY KEY,
  homecell_id BIGINT NOT NULL REFERENCES public.homecells(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  location VARCHAR(255),
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create homecell_reports table
CREATE TABLE IF NOT EXISTS public.homecell_reports (
  id BIGSERIAL PRIMARY KEY,
  homecell_id BIGINT NOT NULL REFERENCES public.homecells(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL,
  report_data JSONB NOT NULL,
  generated_by VARCHAR(255),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  report_period_start DATE,
  report_period_end DATE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_districts_leader_id ON public.districts(leader_id);
CREATE INDEX IF NOT EXISTS idx_districts_is_active ON public.districts(is_active);
CREATE INDEX IF NOT EXISTS idx_zones_district_id ON public.zones(district_id);
CREATE INDEX IF NOT EXISTS idx_zones_leader_id ON public.zones(leader_id);
CREATE INDEX IF NOT EXISTS idx_zones_is_active ON public.zones(is_active);
CREATE INDEX IF NOT EXISTS idx_homecells_zone_id ON public.homecells(zone_id);
CREATE INDEX IF NOT EXISTS idx_homecells_district_id ON public.homecells(district_id);
CREATE INDEX IF NOT EXISTS idx_homecells_leader_id ON public.homecells(leader_id);
CREATE INDEX IF NOT EXISTS idx_homecells_is_active ON public.homecells(is_active);
CREATE INDEX IF NOT EXISTS idx_homecell_members_homecell_id ON public.homecell_members(homecell_id);
CREATE INDEX IF NOT EXISTS idx_homecell_members_member_id ON public.homecell_members(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_homecell ON public.homecell_attendance(homecell_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON public.homecell_attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.homecell_attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_activities_homecell ON public.homecell_activities(homecell_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON public.homecell_activities(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_reports_homecell ON public.homecell_reports(homecell_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.homecell_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_date ON public.homecell_reports(generated_at);

-- Seed districts
INSERT INTO public.districts (district_id, name, description, is_active)
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
```

After pasting the SQL:
1. Click "Run" button (or Ctrl+Enter)
2. Wait for the query to complete
3. You should see "Query executed successfully"

### Option 2: Use Supabase CLI

If you have Supabase CLI installed:

```bash
npm install -g supabase

supabase db execute --file server/migrations/001_create_homecells_tables.sql
supabase db execute --file server/migrations/002_seed_districts.sql
```

### Option 3: Use the API Script

Run this from your project directory:

```bash
node server/scripts/apply-migrations.js
```

## Verification

After applying the migrations, verify in Supabase dashboard:

1. Go to SQL Editor
2. Run this query:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these tables:
- districts
- zones
- homecells
- homecell_members
- homecell_attendance
- homecell_activities
- homecell_reports

## Next Steps

After applying the migrations:

1. Stop your dev server (Ctrl+C)
2. Start it again: `npm run dev`
3. The application should now have access to all homecells features

## Troubleshooting

If you get an error like "Could not find the table 'public.districts'":

1. Go back to Supabase dashboard
2. Check the Tables list in the left sidebar
3. Verify all the above tables exist
4. If they don't exist, re-run the SQL from Option 1

If you're still having issues:

1. Check that you're using the correct Supabase project
2. Verify your SUPABASE_URL and SUPABASE_ANON_KEY in .env
3. Make sure your user has admin permissions in Supabase
