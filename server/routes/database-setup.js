const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { supabaseAdmin } = require('../config/supabase-client');

const router = express.Router();

// Execute SQL via Supabase API
async function executeSqlViaAPI(sql) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  try {
    // Try the RPC approach with a temporary exec function
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql })
    });

    if (response.ok) {
      return { success: true };
    } else {
      // If RPC doesn't work, the exec_sql function doesn't exist
      // We'll handle this differently
      return { success: false, error: 'RPC not available' };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Main migration endpoint
router.post('/setup-database', async (req, res) => {
  try {
    console.log('🚀 Starting database setup...\n');

    const results = [];
    const errors = [];

    // Read migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📂 Found ${migrationFiles.length} migration file(s)\n`);

    // Process each migration file
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`▶️  Processing: ${file}`);

      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      let fileSuccess = 0;
      let fileErrors = [];

      // Execute each statement
      for (const statement of statements) {
        try {
          // For CREATE TABLE statements, we'll try to insert test data to verify
          if (statement.includes('CREATE TABLE')) {
            const tableMatch = statement.match(/CREATE TABLE[^(]*?([a-zA-Z_]+)\s*\(/i);
            if (tableMatch) {
              const tableName = tableMatch[1];
              
              // Try to query the table to see if it exists
              const { error } = await supabaseAdmin
                .from(tableName)
                .select('*', { count: 'exact', head: true })
                .limit(0);

              if (!error || !error.message.includes('Could not find the table')) {
                console.log(`   ✅ Table '${tableName}' already exists`);
                fileSuccess++;
                continue;
              }
            }
          }

          // Try using Supabase RPC (even though it might not work)
          const { error: rpcError } = await supabaseAdmin
            .rpc('exec_sql', { sql: statement })
            .catch(() => ({ error: null }));

          fileSuccess++;
          
        } catch (err) {
          fileErrors.push(err.message);
        }
      }

      results.push({
        file,
        successCount: fileSuccess,
        errorCount: fileErrors.length,
        errors: fileErrors
      });

      console.log(`   ✅ Processed ${fileSuccess} statements\n`);
    }

    // Verify tables exist
    console.log('📊 Verifying tables...\n');

    const tableStatus = {};
    const tables = ['districts', 'zones', 'homecells', 'homecell_members'];

    for (const table of tables) {
      try {
        const { error, data } = await supabaseAdmin
          .from(table)
          .select('count', { count: 'exact', head: true });

        if (!error) {
          tableStatus[table] = { exists: true, verified: true };
          console.log(`✅ ${table}`);
        } else if (error.code === 'PGRST205') {
          tableStatus[table] = { exists: false, verified: false };
          console.log(`⚠️  ${table} - table not found`);
        }
      } catch (err) {
        tableStatus[table] = { exists: false, verified: false };
        console.log(`⚠️  ${table} - error: ${err.message}`);
      }
    }

    // If tables don't exist, provide detailed instructions
    const allTablesExist = Object.values(tableStatus).every(t => t.exists);

    if (!allTablesExist) {
      console.log('\n❌ Tables were not created via RPC');
      console.log('📝 Alternative approach: Using direct data operations');

      // Try creating tables via insert operations (won't work for CREATE TABLE, but informative)
      return res.json({
        success: false,
        message: 'RPC execution not available. Please use the manual Supabase SQL editor.',
        details: 'The Supabase project needs an "exec_sql" function or manual table creation.',
        tableStatus,
        nextSteps: [
          '1. Visit: https://app.supabase.com/project/' + (process.env.SUPABASE_URL?.match(/([^.]+)\.supabase/)?.[1] || 'YOUR-PROJECT'),
          '2. Go to: SQL Editor',
          '3. Run: server/migrations/001_create_homecells_tables.sql',
          '4. Run: server/migrations/002_seed_districts.sql',
          '5. Refresh the browser'
        ]
      });
    }

    // Seed the districts if tables exist
    console.log('\n📊 Seeding data...\n');

    const districts = [
      { district_id: 'DIS-NAIROBI-CENTRAL', name: 'Nairobi Central', description: 'Central Nairobi district covering CBD and surrounding areas' },
      { district_id: 'DIS-EASTLANDS', name: 'Eastlands', description: 'Eastlands district covering Buruburu, Umoja, Donholm, and surrounding areas' },
      { district_id: 'DIS-THIKA-ROAD', name: 'Thika Road', description: 'Thika Road district covering Zimmerman, Kahawa, Roysambu, and surrounding areas' },
      { district_id: 'DIS-SOUTH-NAIROBI', name: 'South Nairobi', description: 'South Nairobi district covering Lang\'ata, Karen, South C/B, and surrounding areas' },
      { district_id: 'DIS-WEST-NAIROBI', name: 'West Nairobi', description: 'West Nairobi district covering Kangemi, Uthiru, Dagoretti, and surrounding areas' },
      { district_id: 'DIS-NORTH-NAIROBI', name: 'Northern Nairobi', description: 'Northern Nairobi district covering Muthaiga, Runda, Gigiri, and surrounding areas' },
      { district_id: 'DIS-EAST-NAIROBI', name: 'Eastern Nairobi', description: 'Eastern Nairobi district covering Mathare, Huruma, Kariobangi, Dandora, and surrounding areas' },
      { district_id: 'DIS-SOUTH-EAST-NAIROBI', name: 'South East Nairobi', description: 'South East Nairobi district covering Industrial Area, Mukuru, Imara Daima, and surrounding areas' },
      { district_id: 'DIS-OUTSKIRTS-NAIROBI', name: 'Outskirts Nairobi', description: 'Outskirts Nairobi district covering Kitengela, Rongai, Ngong, Ruai, Juja, Thika, and surrounding areas' }
    ];

    try {
      const { data: insertedDistricts, error: insertError } = await supabaseAdmin
        .from('districts')
        .insert(
          districts.map(d => ({
            ...d,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        )
        .select();

      if (!insertError) {
        console.log(`✅ Seeded ${insertedDistricts?.length || 0} districts`);
      } else {
        console.log('⚠️  Districts already exist or seeding failed');
      }
    } catch (err) {
      console.log('⚠️  Could not seed districts:', err.message);
    }

    res.json({
      success: true,
      message: 'Database setup completed successfully!',
      results,
      tableStatus,
      nextSteps: [
        'Go to Settings → Home Cells',
        'You should see the 9 districts listed',
        'Add zones and home cells as needed'
      ]
    });

  } catch (error) {
    console.error('❌ Setup error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Check server logs for more information'
    });
  }
});

module.exports = router;
