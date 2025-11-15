const express = require('express');
const fs = require('fs');
const path = require('path');
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

    // First, check if tables exist
    console.log('📊 Checking if tables exist...\n');

    const tableStatus = {};
    const tables = ['districts', 'zones', 'homecells', 'homecell_members'];
    let allTablesExist = true;

    for (const table of tables) {
      try {
        const { error } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          tableStatus[table] = { exists: true };
          console.log(`✅ ${table} - exists`);
        } else {
          tableStatus[table] = { exists: false };
          allTablesExist = false;
          console.log(`⚠️  ${table} - not found`);
        }
      } catch (err) {
        tableStatus[table] = { exists: false };
        allTablesExist = false;
        console.log(`⚠️  ${table} - error`);
      }
    }

    // If tables don't exist, return instructions for manual creation
    if (!allTablesExist) {
      console.log('\n❌ Database tables not found');
      console.log('📝 Please create tables manually using Supabase SQL Editor\n');

      // Read the migration SQL files to provide them to the user
      const migrationsDir = path.join(__dirname, '../migrations');
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      const migrationSQLs = {};
      for (const file of migrationFiles) {
        const filePath = path.join(migrationsDir, file);
        migrationSQLs[file] = fs.readFileSync(filePath, 'utf-8');
      }

      return res.json({
        success: false,
        message: 'Database tables not found. Please create them manually.',
        details: 'Supabase does not support direct SQL execution without a stored procedure. Please use the SQL Editor in the Supabase dashboard to create the tables.',
        tableStatus,
        projectId: process.env.SUPABASE_URL?.match(/([^.]+)\.supabase/)?.[1] || 'YOUR-PROJECT-ID',
        migrationSQLs,
        instructions: [
          '1. Go to: https://app.supabase.com/',
          '2. Select your project',
          '3. Click "SQL Editor" in the left sidebar',
          '4. Click "New query"',
          '5. Copy and paste the SQL from "001_create_homecells_tables.sql"',
          '6. Click "Run"',
          '7. Create another new query',
          '8. Copy and paste the SQL from "002_seed_districts.sql"',
          '9. Click "Run"',
          '10. Refresh this page'
        ]
      });
    }

    console.log('✅ All tables exist!\n');

    // Tables exist, now seed the districts if needed
    console.log('📊 Checking if districts are seeded...\n');

    try {
      const { data: existingDistricts } = await supabaseAdmin
        .from('districts')
        .select('count', { count: 'exact' });

      const districtCount = existingDistricts?.length || 0;

      if (districtCount > 0) {
        console.log(`✅ Districts already seeded (${districtCount} found)\n`);
        return res.json({
          success: true,
          message: 'Database is fully set up!',
          tableStatus: Object.entries(tableStatus).reduce((acc, [table]) => ({
            ...acc,
            [table]: { exists: true }
          }), {}),
          districtCount,
          nextSteps: [
            'Go to Settings → Home Cells',
            'You should see the 9 districts listed',
            'Add zones and home cells as needed',
            'Assign members to home cells in Member Management'
          ]
        });
      }

      // Seed districts
      console.log('🌱 Seeding districts...\n');

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

      const { data: insertedDistricts, error: insertError } = await supabaseAdmin
        .from('districts')
        .insert(
          districts.map(d => ({
            ...d,
            is_active: true
          }))
        )
        .select();

      if (insertError) {
        throw insertError;
      }

      console.log(`✅ Seeded ${insertedDistricts?.length || 0} districts\n`);

      res.json({
        success: true,
        message: 'Database setup completed successfully!',
        tableStatus: Object.entries(tableStatus).reduce((acc, [table]) => ({
          ...acc,
          [table]: { exists: true }
        }), {}),
        districtCount: insertedDistricts?.length || 0,
        nextSteps: [
          'Go to Settings → Home Cells',
          'You should see the 9 districts listed',
          'Add zones and home cells as needed',
          'Assign members to home cells in Member Management'
        ]
      });

    } catch (err) {
      console.error('Error seeding districts:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to seed districts',
        details: err.message
      });
    }

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
