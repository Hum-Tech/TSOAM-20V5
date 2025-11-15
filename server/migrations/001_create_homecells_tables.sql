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
