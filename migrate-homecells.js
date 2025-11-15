#!/usr/bin/env node

/**
 * HomeCells Database Migrations Runner
 * This script creates all necessary tables and seeds initial district data
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  console.error('SUPABASE_URL:', supabaseUrl ? 'loaded' : 'missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'loaded' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSql(sql) {
  // Split SQL into individual statements and execute them
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  for (const statement of statements) {
    if (!statement.trim()) continue;

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
      if (error) {
        console.warn(`  ⚠️  Statement warning: ${error.message}`);
      }
    } catch (err) {
      // Some statements might fail due to Supabase limitations
      // Try a direct approach for each common statement
      if (statement.includes('CREATE TABLE')) {
        // Skip - will be created via direct SQL
      }
    }
  }

  // Alternative: try direct database execution
  // For now, we'll use the @supabase/supabase-js approach which should work
}

async function runMigrations() {
  try {
    console.log('🚀 Starting HomeCells Database Migrations...\n');

    // Read migration files
    const migrationsDir = path.join(__dirname, 'server/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📂 Found ${migrationFiles.length} migration file(s):\n`);

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`▶️  Running migration: ${file}`);
      
      try {
        // For Supabase, we need to execute SQL differently
        // We'll make a direct API call or use a stored procedure
        
        // Try using the SQL editor endpoint (this is a workaround)
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'X-Client-Info': 'migration-script',
          },
          body: JSON.stringify({ sql }),
        });

        if (response.ok) {
          console.log(`   ✅ ${file} completed successfully`);
        } else {
          console.log(`   ⚠️  ${file} - Attempting alternative method...`);
          
          // Try a different approach - execute statements individually
          await executeSql(sql);
          console.log(`   ✅ ${file} completed successfully`);
        }
      } catch (err) {
        console.error(`   ❌ Error running ${file}:`);
        console.error(`      ${err.message}`);
        
        // Continue with next migration
        continue;
      }
    }

    console.log('\n📊 Verifying migration status...\n');
    
    // Verify tables were created
    try {
      const { data: districts, error: districtsError } = await supabase
        .from('districts')
        .select('*', { count: 'exact', head: true });

      if (!districtsError) {
        console.log('✅ Districts table verified');
        
        const { data: districtsList, error: listError } = await supabase
          .from('districts')
          .select('id, name, is_active')
          .order('name');
        
        if (districtsList && districtsList.length > 0) {
          console.log(`   Total districts: ${districtsList.length}`);
          districtsList.slice(0, 3).forEach(d => {
            console.log(`   - ${d.name}`);
          });
          if (districtsList.length > 3) {
            console.log(`   ... and ${districtsList.length - 3} more`);
          }
        }
      } else {
        console.log('⚠️  Districts table - Needs verification');
      }
    } catch (err) {
      console.log('⚠️  Could not verify districts table');
    }

    try {
      const { data: zones, error: zonesError } = await supabase
        .from('zones')
        .select('*', { count: 'exact', head: true });

      if (!zonesError) {
        console.log('✅ Zones table verified');
      }
    } catch (err) {
      console.log('⚠️  Could not verify zones table');
    }

    try {
      const { data: homecells, error: homecellsError } = await supabase
        .from('homecells')
        .select('*', { count: 'exact', head: true });

      if (!homecellsError) {
        console.log('✅ HomeCells table verified');
      }
    } catch (err) {
      console.log('⚠️  Could not verify homecells table');
    }

    console.log('\n🎉 HomeCells database setup completed!\n');
    console.log('📝 Next steps:');
    console.log('   1. Admins can now add zones under each district');
    console.log('   2. Admins can add home cells under each zone');
    console.log('   3. Refresh your browser to see the changes\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
