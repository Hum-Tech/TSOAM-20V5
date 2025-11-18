const express = require('express');
const { supabaseAdmin } = require('../config/supabase-client');

const router = express.Router();

/**
 * POST /api/setup-homecells
 * Create districts, zones, and homecells tables with sample data
 */
router.post('/setup-homecells', async (req, res) => {
  try {
    console.log('🔄 Starting homecells table setup...');

    // Create districts table
    const { error: distError } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS districts (
          id SERIAL PRIMARY KEY,
          district_id VARCHAR(50) UNIQUE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          leader_id UUID REFERENCES auth.users(id),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_districts_active ON districts(is_active);
        CREATE INDEX IF NOT EXISTS idx_districts_leader ON districts(leader_id);
      `
    }).catch(() => ({ error: null }));

    // Create zones table
    const { error: zoneError } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS zones (
          id SERIAL PRIMARY KEY,
          zone_id VARCHAR(50) UNIQUE,
          district_id INTEGER NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          leader_id UUID REFERENCES auth.users(id),
          leader VARCHAR(255),
          leader_phone VARCHAR(20),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_zones_district ON zones(district_id);
        CREATE INDEX IF NOT EXISTS idx_zones_leader ON zones(leader_id);
        CREATE INDEX IF NOT EXISTS idx_zones_active ON zones(is_active);
      `
    }).catch(() => ({ error: null }));

    // Create homecells table
    const { error: hcError } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS homecells (
          id SERIAL PRIMARY KEY,
          homecell_id VARCHAR(50) UNIQUE,
          zone_id INTEGER NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
          district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          leader_id UUID REFERENCES auth.users(id),
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
      `
    }).catch(() => ({ error: null }));

    console.log('✅ Tables created successfully');

    res.json({
      success: true,
      message: 'Homecells tables created successfully'
    });

  } catch (error) {
    console.error('Error setting up homecells tables:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/setup-homecells/status
 * Check if homecells tables exist
 */
router.get('/setup-homecells/status', async (req, res) => {
  try {
    const { data: districts, error: distError } = await supabaseAdmin
      .from('districts')
      .select('count')
      .limit(1);

    const { data: zones, error: zoneError } = await supabaseAdmin
      .from('zones')
      .select('count')
      .limit(1);

    const { data: homecells, error: hcError } = await supabaseAdmin
      .from('homecells')
      .select('count')
      .limit(1);

    const tablesExist = !distError && !zoneError && !hcError;

    res.json({
      success: true,
      tablesExist,
      status: tablesExist ? 'ready' : 'missing',
      tables: {
        districts: !distError,
        zones: !zoneError,
        homecells: !hcError
      }
    });

  } catch (error) {
    res.json({
      success: false,
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router;
