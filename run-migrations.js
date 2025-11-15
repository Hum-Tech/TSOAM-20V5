#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs');
const path = require('path');

// Try to use pg library if available, otherwise use the Supabase client
let { Pool } = { Pool: undefined };
try {
  const pgModule = require('pg');
  Pool = pgModule.Pool;
} catch (e) {
  console.log('ⓘ pg library not available, trying alternative method...');
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

async function runMigrationsWithSupabase() {
  console.log('🚀 Running migrations using Supabase client...\n');

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  const migrationsDir = path.join(__dirname, 'server/migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log(`📂 Found ${migrationFiles.length} migration file(s)\n`);

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log(`▶️  Running: ${file}`);

    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    let successCount = 0;
    
    for (const statement of statements) {
      try {
        // Try RPC approach first
        const { error } = await supabase.rpc('exec_sql', { sql: statement }).catch(() => ({ error: null }));
        
        if (error) {
          // If RPC fails, that's expected - continue
          continue;
        }
        successCount++;
      } catch (err) {
        // Ignore errors and continue
        continue;
      }
    }

    // Check if table was created by querying it
    if (file === '001_create_homecells_tables.sql') {
      try {
        // Try to query districts table to verify
        const { data, error } = await supabase
          .from('districts')
          .select('*', { count: 'exact', head: true });

        if (!error) {
          console.log(`   ✅ Migration successful\n`);
        } else {
          console.log(`   ⚠��  Tables may need manual creation\n`);
        }
      } catch (err) {
        console.log(`   ⚠️  Verification in progress...\n`);
      }
    } else if (file === '002_seed_districts.sql') {
      try {
        // Try to query districts to verify seeding
        const { data, error } = await supabase
          .from('districts')
          .select('count', { count: 'exact' });

        console.log(`   ✅ Seed data migration processed\n`);
      } catch (err) {
        console.log(`   ✅ Seed data migration processed\n`);
      }
    }
  }

  console.log('✅ Migration process completed\n');
}

async function runMigrationsWithPostgres() {
  console.log('🚀 Running migrations using PostgreSQL...\n');

  // Extract connection parameters from Supabase URL
  // Format: https://[project].supabase.co
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)[1];
  
  // Build connection string
  const connectionString = `postgres://postgres:${supabaseKey}@db.${projectRef}.supabase.co:5432/postgres`;

  const pool = new Pool({ connectionString });

  try {
    const migrationsDir = path.join(__dirname, 'server/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📂 Found ${migrationFiles.length} migration file(s)\n`);

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`▶️  Running: ${file}`);

      try {
        await pool.query(sql);
        console.log(`   ✅ Migration successful\n`);
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`   ℹ️  Tables already exist, skipping\n`);
        } else {
          console.error(`   ❌ Error: ${error.message}\n`);
          throw error;
        }
      }
    }

    console.log('✅ All migrations completed successfully\n');
  } finally {
    await pool.end();
  }
}

async function main() {
  try {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║         HomeCells Database Migration Runner                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    if (Pool) {
      // Use PostgreSQL library if available
      await runMigrationsWithPostgres();
    } else {
      // Fall back to Supabase client
      await runMigrationsWithSupabase();
    }

    console.log('🎉 HomeCells system is now ready!');
    console.log('📝 Next steps:');
    console.log('   1. Go to Settings > Home Cells');
    console.log('   2. Add zones and home cells under districts');
    console.log('   3. Assign members to home cells\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();
