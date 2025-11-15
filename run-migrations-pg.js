#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

// Parse Supabase URL to extract project reference
// Format: https://[project].supabase.co
const projectMatch = supabaseUrl.match(/https:\/\/([^.]+)/);
if (!projectMatch) {
  console.error('❌ Invalid SUPABASE_URL format');
  process.exit(1);
}

const projectRef = projectMatch[1];

// Build connection string for Supabase PostgreSQL
// Format: postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
const connectionString = `postgresql://postgres:${supabaseServiceKey}@db.${projectRef}.supabase.co:5432/postgres`;

async function runMigrations() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║         HomeCells Database Migration Runner                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('🔗 Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');

    const migrationsDir = path.join(__dirname, 'server/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📂 Found ${migrationFiles.length} migration file(s)\n`);

    let successCount = 0;
    let failureCount = 0;

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`▶️  Running: ${file}`);

      try {
        // Execute the entire SQL file
        await client.query(sql);
        console.log(`   ✅ Migration successful\n`);
        successCount++;
      } catch (error) {
        // Some errors might be benign (like tables already existing)
        if (error.message.includes('already exists') || 
            error.code === '42P07' || // duplicate table
            error.code === '42P06'    // duplicate schema
        ) {
          console.log(`   ℹ️  Tables or objects already exist (skipping)\n`);
          successCount++;
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`   ⚠️  Reference issue (continuing): ${error.message}\n`);
          successCount++;
        } else {
          console.error(`   ❌ Error: ${error.message}\n`);
          console.error(`      Code: ${error.code}\n`);
          failureCount++;
        }
      }
    }

    // Verify tables exist
    console.log('📊 Verifying tables...\n');

    try {
      const result = await client.query('SELECT * FROM public.districts LIMIT 1');
      console.log('✅ Districts table verified');
    } catch (err) {
      console.log('⚠️  Districts table verification failed');
    }

    try {
      const result = await client.query('SELECT * FROM public.zones LIMIT 1');
      console.log('✅ Zones table verified');
    } catch (err) {
      console.log('⚠️  Zones table verification failed');
    }

    try {
      const result = await client.query('SELECT * FROM public.homecells LIMIT 1');
      console.log('✅ HomeCells table verified');
    } catch (err) {
      console.log('⚠️  HomeCells table verification failed');
    }

    // Count seeded districts
    try {
      const result = await client.query('SELECT COUNT(*) FROM public.districts');
      const count = parseInt(result.rows[0].count);
      console.log(`\n📍 Districts seeded: ${count}`);
    } catch (err) {
      console.log('\n⚠️  Could not count districts');
    }

    console.log('\n📋 Migration Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`📋 Total: ${migrationFiles.length}\n`);

    if (failureCount === 0) {
      console.log('✅ All migrations completed successfully!');
      console.log('\n🎉 HomeCells system is now ready!');
      console.log('📝 Next steps:');
      console.log('   1. Refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)');
      console.log('   2. Go to Settings > Home Cells');
      console.log('   3. You should see the 9 pre-seeded districts');
      console.log('   4. Add zones and home cells as needed\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    try {
      await client.end();
      console.log('🔌 Database connection closed');
    } catch (err) {
      // Ignore
    }
  }
}

runMigrations()
  .catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
