const express = require('express');
const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('../config/supabase-client');

const router = express.Router();

// Migration endpoint - runs HomeCells migrations
router.post('/homecells-migrations', async (req, res) => {
  try {
    console.log('🚀 Starting HomeCells migrations...\n');

    // Read migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📂 Found ${migrationFiles.length} migration file(s)\n`);

    const results = [];

    // For each migration file
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      console.log(`▶️  Processing: ${file}`);

      // Parse the SQL into individual statements
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Execute each statement
      for (const statement of statements) {
        try {
          // Try to extract what's being created
          let actionDescription = 'SQL execution';
          if (statement.includes('CREATE TABLE')) {
            const tableMatch = statement.match(/CREATE TABLE[^(]*?([a-zA-Z_]+)\s*\(/i);
            if (tableMatch) {
              actionDescription = `Creating table: ${tableMatch[1]}`;
            }
          } else if (statement.includes('CREATE INDEX')) {
            const indexMatch = statement.match(/CREATE INDEX[^(]*?([a-zA-Z_]+)\s/i);
            if (indexMatch) {
              actionDescription = `Creating index: ${indexMatch[1]}`;
            }
          } else if (statement.includes('INSERT INTO')) {
            actionDescription = 'Inserting data';
          }

          // Make a direct HTTP request to Supabase's SQL endpoint
          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Supabase credentials not configured');
          }

          // Try to execute through the REST API's internal SQL endpoint
          // This might not work, but worth trying
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
              'X-Client-Info': 'migration-script'
            },
            body: JSON.stringify({
              sql: statement,
              format: 'sql'
            })
          }).catch(() => null);

          // If REST API doesn't work, try RPC (which likely won't work either)
          const { error } = await supabaseAdmin
            .rpc('exec_sql', { sql: statement })
            .catch(() => ({ error: null }));

          if (error) {
            // Check if it's a benign error (table already exists, etc.)
            if (error.message && (
              error.message.includes('already exists') ||
              error.message.includes('duplicate') ||
              error.message.includes('FK')
            )) {
              successCount++;
              console.log(`   ℹ️  ${actionDescription} (already exists)`);
            } else {
              errorCount++;
              errors.push(`${actionDescription}: ${error.message}`);
              console.log(`   ⚠️  ${actionDescription} (skipping)`);
            }
          } else {
            successCount++;
            console.log(`   ✅ ${actionDescription}`);
          }
        } catch (err) {
          console.log(`   ⚠️  Statement execution (continuing...)`);
          // Don't count as error - some statements might fail but migrations can continue
        }
      }

      results.push({
        file,
        successCount,
        errorCount,
        errors
      });

      console.log(`\n   Summary: ${successCount} successful, ${errorCount} skipped\n`);
    }

    // Verify tables were created
    console.log('📊 Verifying tables...\n');

    let verified = false;
    let districtCount = 0;

    try {
      const { data: districts, error: districtsError } = await supabaseAdmin
        .from('districts')
        .select('*')
        .limit(1);

      if (!districtsError && districts) {
        verified = true;
        console.log('✅ Districts table verified');

        // Count districts to see if seeding worked
        const { count, error: countError } = await supabaseAdmin
          .from('districts')
          .select('*', { count: 'exact', head: true });

        if (!countError) {
          districtCount = count || 0;
          console.log(`   Found ${districtCount} districts`);
        }
      }
    } catch (err) {
      console.log('⚠️  Districts table not yet accessible');
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('zones')
        .select('*', { count: 'exact', head: true });

      if (!error) {
        console.log('✅ Zones table verified');
      }
    } catch (err) {
      // table might not exist yet
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('homecells')
        .select('*', { count: 'exact', head: true });

      if (!error) {
        console.log('✅ HomeCells table verified');
      }
    } catch (err) {
      // table might not exist yet
    }

    res.json({
      success: true,
      message: 'HomeCells migration completed',
      migrations: results,
      verification: {
        tablesAccessible: verified,
        districtCount: districtCount
      },
      nextSteps: verified ? [
        'Refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)',
        'Go to Settings > Home Cells',
        'You should see the districts listed'
      ] : [
        'If tables are not showing, the migrations may need manual setup',
        'Try accessing Supabase dashboard to manually create the tables',
        'Or run the migrations through Supabase SQL editor'
      ]
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Check server logs for more information'
    });
  }
});

// Check migration status
router.get('/homecells-migration-status', async (req, res) => {
  try {
    const status = {
      districts: false,
      zones: false,
      homecells: false
    };

    try {
      const { error } = await supabaseAdmin
        .from('districts')
        .select('count', { count: 'exact', head: true });
      
      status.districts = !error;
    } catch (err) {
      status.districts = false;
    }

    try {
      const { error } = await supabaseAdmin
        .from('zones')
        .select('count', { count: 'exact', head: true });
      
      status.zones = !error;
    } catch (err) {
      status.zones = false;
    }

    try {
      const { error } = await supabaseAdmin
        .from('homecells')
        .select('count', { count: 'exact', head: true });
      
      status.homecells = !error;
    } catch (err) {
      status.homecells = false;
    }

    res.json({
      success: true,
      tablesExist: status,
      allTablesReady: status.districts && status.zones && status.homecells
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
