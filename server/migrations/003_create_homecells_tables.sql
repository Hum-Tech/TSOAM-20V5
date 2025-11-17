-- ============================================================================
-- 003. CREATE DISTRICTS TABLE
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
-- 004. CREATE ZONES TABLE
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
-- 005. CREATE HOMECELLS TABLE
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
-- 006. INSERT SAMPLE DATA
-- ============================================================================
INSERT INTO districts (name, description, is_active) VALUES
('Nairobi Central', 'Central Nairobi area', true),
('Nairobi East', 'East Nairobi area', true),
('Nairobi West', 'West Nairobi area', true)
ON CONFLICT (district_id) DO NOTHING;

INSERT INTO zones (district_id, name, leader, leader_phone, is_active) VALUES
(1, 'Zone A1', 'John Mwangi', '+254712345678', true),
(1, 'Zone A2', 'Mary Kipchoge', '+254712345679', true),
(2, 'Zone B1', 'Peter Okonkwo', '+254712345680', true),
(3, 'Zone C1', 'Grace Nyambura', '+254712345681', true)
ON CONFLICT (zone_id) DO NOTHING;

INSERT INTO homecells (zone_id, name, leader, leader_phone, meeting_day, meeting_time, meeting_location, is_active) VALUES
(1, 'Zion', 'David Kipchoge', '+254722345678', 'Wednesday', '6:00 PM', 'Riverside Community', true),
(1, 'Judah', 'Ruth Mwangi', '+254722345679', 'Thursday', '5:30 PM', 'Kilimani District', true),
(2, 'Bethel', 'Samuel Okonkwo', '+254722345680', 'Tuesday', '7:00 PM', 'Kasarani Area', true),
(3, 'Philistine', 'Joyce Nyambura', '+254722345681', 'Wednesday', '6:30 PM', 'Westlands Center', true)
ON CONFLICT (homecell_id) DO NOTHING;
