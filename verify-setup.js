const { supabaseAdmin, isSupabaseConfigured } = require('./server/config/supabase-client');

const REQUIRED_TABLES = [
  'users',
  'members',
  'employees',
  'financial_transactions',
  'departments',
  'roles',
  'homecells',
  'events',
  'appointments',
  'districts',
  'modules',
  'module_features',
  'subscriptions',
  'system_logs',
  'form_entries',
  'audit_logs',
  'document_uploads'
];

async function verifyTables() {
  if (!isSupabaseConfigured) {
    console.error('❌ Supabase not configured. Check your environment variables.');
    process.exit(1);
  }

  console.log('🔍 Verifying Supabase database setup...\n');

  let successCount = 0;
  let failureCount = 0;
  const missingTables = [];

  for (const tableName of REQUIRED_TABLES) {
    try {
      const { count, error } = await supabaseAdmin
        .from(tableName)
        .select('id', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${tableName} - Missing or inaccessible`);
        missingTables.push(tableName);
        failureCount++;
      } else {
        console.log(`✅ ${tableName} - Found (${count || 0} records)`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ ${tableName} - Error checking: ${err.message}`);
      missingTables.push(tableName);
      failureCount++;
    }
  }

  console.log(`\n📊 Summary: ${successCount}/${REQUIRED_TABLES.length} tables verified\n`);

  if (missingTables.length > 0) {
    console.log(`⚠️  Missing tables: ${missingTables.join(', ')}`);
    console.log('\n📋 Action Required:');
    console.log('1. Go to Supabase dashboard: https://app.supabase.com');
    console.log('2. Select your project');
    console.log('3. Click "SQL Editor" in the left sidebar');
    console.log('4. Paste the contents of SUPABASE_COMPLETE_SETUP.sql');
    console.log('5. Click "Run" to execute the script');
    process.exit(1);
  }

  console.log('✅ All required tables are present!\n');
  return true;
}

async function checkAdminUser() {
  console.log('🔍 Checking for admin user...\n');

  try {
    const { data: adminUser, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'admin@tsoam.org')
      .single();

    if (error) {
      console.log('❌ No admin user found');
      return false;
    }

    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Status: ${adminUser.is_active ? 'Active' : 'Inactive'}`);
      return true;
    }
  } catch (err) {
    console.log('❌ Error checking admin user:', err.message);
    return false;
  }
}

async function main() {
  try {
    await verifyTables();
    const hasAdmin = await checkAdminUser();

    console.log('\n🎯 Next Steps:');
    if (!hasAdmin) {
      console.log('1. Run: node create-admin-user.js');
      console.log('   This will create the admin@tsoam.org account');
      console.log('2. Then restart the application');
    } else {
      console.log('1. System is ready to use!');
      console.log('2. Login at http://localhost:5173 with your admin account');
    }
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

main();
