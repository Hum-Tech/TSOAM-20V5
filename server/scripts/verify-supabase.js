require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  console.error('Required: SUPABASE_URL, SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

async function testConnectivity() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║          Supabase Connectivity Verification            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    console.log('🔍 Testing Supabase connectivity...\n');

    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })
      .limit(1);

    if (testError && testError.code !== 'PGRST116') {
      console.error('❌ Connection failed:', testError.message);
      return false;
    }

    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    return false;
  }
}

async function testTables() {
  console.log('\n📋 Verifying database tables...\n');

  const requiredTables = [
    'users',
    'members',
    'employees',
    'financial_transactions',
    'events',
    'appointments',
    'messages',
    'welfare_requests',
    'system_logs',
    'role_permissions',
    'system_settings'
  ];

  let foundTables = 0;
  let missingTables = [];

  for (const table of requiredTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.log(`❌ Table missing: ${table}`);
        missingTables.push(table);
      } else {
        console.log(`✅ Table exists: ${table}`);
        foundTables++;
      }
    } catch (error) {
      console.log(`⚠️  Error checking table ${table}: ${error.message}`);
      missingTables.push(table);
    }
  }

  console.log(`\n📊 Table Summary: ${foundTables}/${requiredTables.length} found`);
  
  if (missingTables.length > 0) {
    console.log(`⚠️  Missing tables: ${missingTables.join(', ')}`);
    return false;
  }

  return true;
}

async function testReadOperations() {
  console.log('\n📖 Testing read operations...\n');

  try {
    // Test reading users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    if (usersError) {
      console.error('❌ Failed to read users:', usersError.message);
      return false;
    }

    console.log(`✅ Successfully read users: ${users?.length || 0} records`);

    // Test reading members
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .limit(5);

    if (membersError) {
      console.error('❌ Failed to read members:', membersError.message);
      return false;
    }

    console.log(`✅ Successfully read members: ${members?.length || 0} records`);

    // Test reading financial transactions
    const { data: transactions, error: transError } = await supabase
      .from('financial_transactions')
      .select('*')
      .limit(5);

    if (transError) {
      console.error('❌ Failed to read transactions:', transError.message);
      return false;
    }

    console.log(`✅ Successfully read transactions: ${transactions?.length || 0} records`);

    // Test reading system logs
    const { data: logs, error: logsError } = await supabase
      .from('system_logs')
      .select('*')
      .limit(5);

    if (logsError) {
      console.error('❌ Failed to read logs:', logsError.message);
      return false;
    }

    console.log(`✅ Successfully read logs: ${logs?.length || 0} records`);

    return true;
  } catch (error) {
    console.error('❌ Read operation error:', error.message);
    return false;
  }
}

async function testWriteOperations() {
  console.log('\n✍️  Testing write operations...\n');

  try {
    // Test writing a system log (non-destructive test)
    const { data: logData, error: logError } = await supabaseAdmin
      .from('system_logs')
      .insert([{
        log_id: `test-${Date.now()}`,
        action: 'DATABASE_VERIFICATION',
        module: 'SYSTEM',
        details: 'Testing write operations',
        severity: 'Info',
        status: 'Success',
        timestamp: new Date().toISOString()
      }])
      .select();

    if (logError) {
      console.error('❌ Failed to write system log:', logError.message);
      return false;
    }

    console.log(`✅ Successfully wrote system log`);

    // Test writing role permissions (if not already there)
    const { data: permData, error: permError } = await supabaseAdmin
      .from('role_permissions')
      .select('*')
      .eq('role_name', 'Admin')
      .eq('permission_name', 'dashboard_view')
      .limit(1);

    if (!permData || permData.length === 0) {
      const { error: insertError } = await supabaseAdmin
        .from('role_permissions')
        .insert([{
          role_name: 'Admin',
          permission_name: 'dashboard_view',
          permission_value: true,
          description: 'View dashboard'
        }]);

      if (insertError && !insertError.message.includes('duplicate')) {
        console.error('❌ Failed to write role permission:', insertError.message);
        return false;
      }
    }

    console.log(`✅ Successfully wrote role permissions`);

    // Test writing system settings
    const { data: settingData, error: settingError } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('setting_key', 'church_name')
      .limit(1);

    if (!settingData || settingData.length === 0) {
      const { error: insertError } = await supabaseAdmin
        .from('system_settings')
        .insert([{
          setting_key: 'church_name',
          setting_value: 'The Seed of Abraham Ministry (TSOAM)',
          setting_type: 'string',
          category: 'general',
          is_public: true
        }]);

      if (insertError && !insertError.message.includes('duplicate')) {
        console.error('❌ Failed to write system settings:', insertError.message);
        return false;
      }
    }

    console.log(`✅ Successfully wrote system settings`);

    return true;
  } catch (error) {
    console.error('❌ Write operation error:', error.message);
    return false;
  }
}

async function testAuthFlow() {
  console.log('\n🔐 Testing authentication flow...\n');

  try {
    // Check if admin user exists
    const { data: adminUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@tsoam.org')
      .eq('is_active', true)
      .limit(1);

    if (findError) {
      console.error('❌ Failed to query admin user:', findError.message);
      return false;
    }

    if (!adminUser || adminUser.length === 0) {
      console.error('❌ Admin user not found');
      return false;
    }

    console.log(`✅ Admin user found: ${adminUser[0].name}`);

    // Test user update
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', adminUser[0].id);

    if (updateError) {
      console.error('❌ Failed to update user:', updateError.message);
      return false;
    }

    console.log(`✅ Successfully updated user last_login`);

    return true;
  } catch (error) {
    console.error('❌ Auth flow error:', error.message);
    return false;
  }
}

async function runAllTests() {
  const results = {
    connectivity: await testConnectivity(),
    tables: await testTables(),
    read: await testReadOperations(),
    write: await testWriteOperations(),
    auth: await testAuthFlow()
  };

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║              Verification Summary                      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('Test Results:');
  console.log(`  ✅ Connectivity:  ${results.connectivity ? 'PASS' : 'FAIL'}`);
  console.log(`  ✅ Tables:        ${results.tables ? 'PASS' : 'FAIL'}`);
  console.log(`  ✅ Read Ops:      ${results.read ? 'PASS' : 'FAIL'}`);
  console.log(`  ✅ Write Ops:     ${results.write ? 'PASS' : 'FAIL'}`);
  console.log(`  ✅ Auth Flow:     ${results.auth ? 'PASS' : 'FAIL'}`);

  const allPass = Object.values(results).every(r => r === true);

  if (allPass) {
    console.log('\n✅ All verification tests passed!');
    console.log('🚀 System is ready for use\n');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
    return false;
  }
}

// Run tests
if (require.main === module) {
  runAllTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };
