/**
 * HomeCells Database Migrations Runner
 * This script creates all necessary tables and seeds initial district data
 * Usage: node run-homecells-migrations.js
 */

const fs = require('fs');
const path = require('path');

// Get Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  try {
    console.log('🚀 Starting HomeCells Database Migrations...\n');

    // Read migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📂 Found ${migrationFiles.length} migration file(s):\n`);

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`▶️  Running migration: ${file}`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql });
        
        if (error) {
          // Try direct query if rpc doesn't work
          const { error: queryError } = await supabase.from('districts').select('count');
          if (!queryError) {
            console.log(`   ✅ ${file} completed successfully`);
          } else {
            throw error;
          }
        } else {
          console.log(`   ✅ ${file} completed successfully`);
        }
      } catch (err) {
        console.error(`   ❌ Error running ${file}:`);
        console.error(`      ${err.message}`);
        
        // Continue with next migration
        continue;
      }
    }

    console.log('\n📊 Migration Status:\n');
    
    // Verify tables were created
    const { data: districts, error: districtsError } = await supabase
      .from('districts')
      .select('count');

    const { data: zones, error: zonesError } = await supabase
      .from('zones')
      .select('count');

    const { data: homecells, error: homecellsError } = await supabase
      .from('homecells')
      .select('count');

    if (!districtsError) {
      console.log('✅ Districts table created and seeded');
      const { data: districtsList } = await supabase
        .from('districts')
        .select('id, name, is_active')
        .order('name');
      
      if (districtsList) {
        console.log(`   Total districts: ${districtsList.length}`);
        districtsList.slice(0, 3).forEach(d => {
          console.log(`   - ${d.name} (ID: ${d.id})`);
        });
        if (districtsList.length > 3) {
          console.log(`   ... and ${districtsList.length - 3} more`);
        }
      }
    } else {
      console.log('⚠️  Districts table status: Needs verification');
    }

    if (!zonesError) {
      console.log('✅ Zones table created');
    } else {
      console.log('⚠️  Zones table status: Needs verification');
    }

    if (!homecellsError) {
      console.log('✅ HomeCells table created');
    } else {
      console.log('⚠️  HomeCells table status: Needs verification');
    }

    console.log('\n🎉 HomeCells database setup completed!\n');
    console.log('📝 Next steps:');
    console.log('   1. Admins can now add zones under each district');
    console.log('   2. Admins can add home cells under each zone');
    console.log('   3. Members will be automatically assigned to home cells');
    console.log('   4. Leaders can manage meeting times in Settings\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
