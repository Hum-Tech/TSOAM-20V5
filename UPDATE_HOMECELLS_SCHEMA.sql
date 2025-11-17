-- ============================================================================
-- UPDATE HOMECELLS SCHEMA - Add missing fields and ensure proper structure
-- ============================================================================

-- Ensure districts table has all necessary fields
ALTER TABLE districts ADD COLUMN IF NOT EXISTS district_id VARCHAR(50) UNIQUE;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS description TEXT;

-- Ensure zones table has all necessary fields
ALTER TABLE zones ADD COLUMN IF NOT EXISTS zone_id VARCHAR(50) UNIQUE;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS description TEXT;

-- Ensure homecells table has all necessary fields
ALTER TABLE homecells ADD COLUMN IF NOT EXISTS meeting_day VARCHAR(20);
ALTER TABLE homecells ADD COLUMN IF NOT EXISTS meeting_time VARCHAR(10);
ALTER TABLE homecells ADD COLUMN IF NOT EXISTS meeting_location VARCHAR(255);
ALTER TABLE homecells ADD COLUMN IF NOT EXISTS description TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_districts_name ON districts(name);
CREATE INDEX IF NOT EXISTS idx_zones_name ON zones(name);
CREATE INDEX IF NOT EXISTS idx_homecells_name ON homecells(name);

-- Ensure member assignment fields
ALTER TABLE members ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE homecell_members ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================================================
-- ENSURE SAMPLE DATA EXISTS
-- ============================================================================

-- Insert default districts if they don't exist
INSERT INTO districts (name, description, is_active)
VALUES
  ('Nairobi Central', 'Central Nairobi area', true),
  ('Nairobi East', 'East Nairobi area', true),
  ('Nairobi West', 'West Nairobi area', true)
ON CONFLICT (name) DO NOTHING;

-- Insert zones for first district
INSERT INTO zones (district_id, name, leader, leader_phone, is_active)
VALUES
  (1, 'Zone A1', 'John Mwangi', '+254712345678', true),
  (1, 'Zone A2', 'Mary Kipchoge', '+254712345679', true),
  (2, 'Zone B1', 'Peter Okonkwo', '+254712345680', true),
  (3, 'Zone C1', 'Grace Nyambura', '+254712345681', true)
ON CONFLICT (zone_id) DO NOTHING;

-- Insert homecells for zones
INSERT INTO homecells (zone_id, name, leader, leader_phone, meeting_day, meeting_time, meeting_location, is_active)
VALUES
  (1, 'Zion', 'David Kipchoge', '+254722345678', 'Wednesday', '6:00 PM', 'Riverside Community', true),
  (1, 'Judah', 'Ruth Mwangi', '+254722345679', 'Thursday', '5:30 PM', 'Kilimani District', true),
  (2, 'Bethel', 'Samuel Okonkwo', '+254722345680', 'Tuesday', '7:00 PM', 'Kasarani Area', true),
  (3, 'Philistine', 'Joyce Nyambura', '+254722345681', 'Wednesday', '6:30 PM', 'Westlands Center', true),
  (1, 'Mount Zion', 'Stephen Kipchoge', '+254722345682', 'Friday', '7:00 PM', 'CBD Area', true),
  (2, 'Ephraim', 'Elizabeth Mwangi', '+254722345683', 'Saturday', '3:00 PM', 'Eastleigh', true),
  (3, 'Benjamin', 'Joshua Kipchoge', '+254722345684', 'Sunday', '2:00 PM', 'Langata Road', true),
  (1, 'Issachar', 'Sophia Kipchoge', '+254722345685', 'Monday', '6:30 PM', 'Westlands', true),
  (2, 'Zebulun', 'Michael Kipchoge', '+254722345686', 'Wednesday', '5:00 PM', 'Makadara', true)
ON CONFLICT (homecell_id) DO NOTHING;

-- ============================================================================
-- SCHEMA UPDATE COMPLETE
-- ============================================================================
