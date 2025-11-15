-- Seed all districts for TSOAM Church Management System
-- This data allows admins to add zones and home cells under each district

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
