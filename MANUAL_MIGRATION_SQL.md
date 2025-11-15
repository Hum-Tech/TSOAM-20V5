# Manual HomeCells Database Migration

Since automated migrations are limited by Supabase's API, you'll need to manually run the SQL in the Supabase dashboard.

## Steps:

1. Go to: https://app.supabase.com/
2. Select your project: **ncrecohwtejwygkyoaul**
3. In the left sidebar, click: **SQL Editor**
4. Click: **"New query"**
5. Copy and paste **exactly one** of the SQL blocks below
6. Click: **Run** (or press Cmd/Ctrl + Enter)
7. Once complete, go back and repeat steps 3-6 with the next SQL block

---

## SQL Block 1: Create Tables

```sql
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

-- Create homecell_members table
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

-- Create indexes
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
```

---

## SQL Block 2: Seed Districts

```sql
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

---

## After Running the SQL:

1. **Refresh your browser**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **Go to Settings** → **Home Cells** tab
3. You should see the 9 districts listed
4. You can now add zones and home cells under each district

---

## Troubleshooting:

- **"Table already exists" error**: This is fine, it means the table was already created
- **"Foreign key error"**: Make sure you run Block 1 before Block 2
- **Districts not showing**: Wait a moment and refresh (tables may need time to register)
- **Still not working**: Check the Supabase SQL error messages and ensure all queries completed without errors

