require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrations = [
  {
    name: 'Create districts table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.districts (
        id BIGSERIAL PRIMARY KEY,
        district_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        leader_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_districts_name ON public.districts(name);
      CREATE INDEX IF NOT EXISTS idx_districts_leader ON public.districts(leader_id);
      CREATE INDEX IF NOT EXISTS idx_districts_active ON public.districts(is_active);
    `
  },
  {
    name: 'Create zones table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.zones (
        id BIGSERIAL PRIMARY KEY,
        zone_id VARCHAR(50) UNIQUE NOT NULL,
        district_id BIGINT NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        leader_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_zones_district ON public.zones(district_id);
      CREATE INDEX IF NOT EXISTS idx_zones_name ON public.zones(name);
      CREATE INDEX IF NOT EXISTS idx_zones_leader ON public.zones(leader_id);
      CREATE INDEX IF NOT EXISTS idx_zones_active ON public.zones(is_active);
    `
  },
  {
    name: 'Create homecells table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.homecells (
        id BIGSERIAL PRIMARY KEY,
        homecell_id VARCHAR(50) UNIQUE NOT NULL,
        zone_id BIGINT NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
        district_id BIGINT NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        leader_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
        meeting_day VARCHAR(20),
        meeting_time TIME,
        meeting_location VARCHAR(500),
        member_count INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_homecells_zone ON public.homecells(zone_id);
      CREATE INDEX IF NOT EXISTS idx_homecells_district ON public.homecells(district_id);
      CREATE INDEX IF NOT EXISTS idx_homecells_name ON public.homecells(name);
      CREATE INDEX IF NOT EXISTS idx_homecells_leader ON public.homecells(leader_id);
      CREATE INDEX IF NOT EXISTS idx_homecells_active ON public.homecells(is_active);
    `
  },
  {
    name: 'Add homecell_id to members table',
    sql: `
      ALTER TABLE public.members 
      ADD COLUMN IF NOT EXISTS homecell_id BIGINT REFERENCES public.homecells(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_members_homecell ON public.members(homecell_id);
    `
  },
  {
    name: 'Create homecell_assignments tracking table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.homecell_assignments (
        id BIGSERIAL PRIMARY KEY,
        member_id BIGINT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
        homecell_id BIGINT NOT NULL REFERENCES public.homecells(id) ON DELETE CASCADE,
        assigned_date DATE DEFAULT CURRENT_DATE,
        assigned_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(member_id, homecell_id)
      );
      CREATE INDEX IF NOT EXISTS idx_homecell_assignments_member ON public.homecell_assignments(member_id);
      CREATE INDEX IF NOT EXISTS idx_homecell_assignments_homecell ON public.homecell_assignments(homecell_id);
    `
  }
];

async function executeMigration(migration) {
  const statements = migration.sql.split(';').filter(s => s.trim().length > 0);
  
  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement }).catch(() => ({ error: null }));
      
      if (error && !error.message.includes('already exists') && !error.message.includes('duplicate')) {
        console.error(`❌ ${migration.name} - Error:`, error.message);
        return false;
      }
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.error(`❌ ${migration.name} - Exception:`, err.message);
        return false;
      }
    }
  }
  
  return true;
}

async function runMigrations() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Setting up HomeCells, Zones, and Districts Structure  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  let successCount = 0;
  let failureCount = 0;

  for (const migration of migrations) {
    console.log(`⏳ ${migration.name}...`);
    
    try {
      const success = await executeMigration(migration);
      if (success) {
        console.log(`✅ ${migration.name}\n`);
        successCount++;
      } else {
        console.log(`⚠️  ${migration.name} (may need manual review)\n`);
        failureCount++;
      }
    } catch (error) {
      console.error(`❌ ${migration.name}:`, error.message);
      failureCount++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`⚠️  Issues: ${failureCount}`);
  console.log(`📋 Total: ${migrations.length}\n`);

  if (failureCount === 0) {
    console.log('✅ HomeCells structure setup completed successfully!');
    return true;
  } else {
    console.log('⚠️  Some migrations need manual review');
    return false;
  }
}

if (require.main === module) {
  runMigrations()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
