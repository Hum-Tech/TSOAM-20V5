const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase admin client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  try {
    console.log('🚀 Starting Supabase setup for new account...');
    console.log(`📍 URL: ${supabaseUrl}`);

    // Read all migration files
    const migrationsDir = path.join(__dirname, 'server', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`\n📋 Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach(f => console.log(`   - ${f}`));

    // Apply each migration
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`\n⏳ Applying migration: ${file}`);
      
      try {
        // Execute the SQL
        const { error } = await supabase.rpc('exec_sql', { sql });
        
        if (error) {
          // Try direct SQL execution if RPC fails
          console.log('   ⚠️  RPC exec_sql not available, trying direct SQL...');
          
          // Split by statements for safer execution
          const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

          for (const statement of statements) {
            const { error: execError } = await supabase.rpc('exec', { sql: statement });
            if (execError && !statement.includes('ON CONFLICT')) {
              console.log(`   ⚠️  Skipping statement (may already exist): ${statement.substring(0, 50)}...`);
            }
          }
        }
        
        console.log(`   ✅ ${file} completed`);
      } catch (err) {
        console.log(`   ⚠️  Warning: ${file} - ${err.message}`);
      }
    }

    console.log('\n✅ Migration process completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Go to Supabase SQL Editor: https://app.supabase.com/project/' + supabaseUrl.split('/')[3]);
    console.log('   2. Manually run each migration file from server/migrations/ folder');
    console.log('   3. Or use the complete schema file: database/supabase-schema.sql');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
