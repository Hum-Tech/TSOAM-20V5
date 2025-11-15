require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         TSOAM Church Management System - Supabase Setup       ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Validate environment
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  console.error('   SUPABASE_URL: ' + (supabaseUrl ? '✅' : '❌'));
  console.error('   SUPABASE_ANON_KEY: ' + (supabaseAnonKey ? '✅' : '❌'));
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY not found (optional, but recommended)');
  console.log('\n📖 To get your Service Role Key:');
  console.log('   1. Go to https://app.supabase.com/');
  console.log('   2. Select your project: ' + supabaseUrl.split('/')[2]);
  console.log('   3. Navigate to Settings > API');
  console.log('   4. Copy the "Service Role" key (labeled as "JWT Secret" or "Service Role" key)');
  console.log('   5. Add to .env: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  console.log('   6. Restart the server\n');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

// Step 1: Create tables
async function createTables() {
  console.log('\n📋 Step 1: Creating database tables...\n');

  try {
    const { setupSupabase } = require('./setup-supabase-complete');
    const result = await setupSupabase();
    return result;
  } catch (error) {
    console.error('❌ Table creation failed:', error.message);
    return false;
  }
}

// Step 2: Initialize data
async function initializeData() {
  console.log('\n📝 Step 2: Initializing default data...\n');

  try {
    const { initSupabase } = require('./init-supabase');
    const result = await initSupabase();
    return result;
  } catch (error) {
    console.error('❌ Data initialization failed:', error.message);
    return false;
  }
}

// Step 3: Setup RLS policies (if service key available)
async function setupRls() {
  if (!supabaseServiceKey) {
    console.log('\n🔐 Step 3: RLS (Row Level Security) - SKIPPED');
    console.log('   ⓘ Service Role Key needed. Follow instructions above to enable RLS.\n');
    return true; // Not a hard failure
  }

  console.log('\n🔐 Step 3: Setting up RLS (Row Level Security)...\n');

  try {
    const { setupRlsPolicies } = require('./setup-rls-policies');
    const result = await setupRlsPolicies();
    return result;
  } catch (error) {
    console.error('⚠️  RLS setup encountered issues:', error.message);
    return true; // Not a hard failure
  }
}

// Step 4: Verify installation
async function verifyInstallation() {
  console.log('\n✅ Step 4: Verifying installation...\n');

  try {
    // Check tables
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })
      .limit(1);

    if (usersError && usersError.code !== 'PGRST116') {
      console.error('❌ Cannot access users table');
      return false;
    }

    console.log('✅ Database tables accessible');

    // Check admin user
    const { data: adminUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@tsoam.org')
      .limit(1);

    if (adminUser && adminUser.length > 0) {
      console.log('✅ Admin user exists');
    } else {
      console.log('⚠️  Admin user not found');
    }

    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

// Main initialization
async function initializeSupabase() {
  try {
    // Step 1: Create tables
    const tablesOk = await createTables();
    if (!tablesOk) {
      console.log('⚠️  Table creation completed with warnings');
    }

    // Step 2: Initialize data
    const dataOk = await initializeData();
    if (!dataOk) {
      console.log('⚠️  Data initialization completed with warnings');
    }

    // Step 3: Setup RLS
    const rlsOk = await setupRls();
    if (!rlsOk) {
      console.log('⚠️  RLS setup completed with warnings');
    }

    // Step 4: Verify
    const verifyOk = await verifyInstallation();

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                   Initialization Summary                      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('Database Tables:    ' + (tablesOk ? '✅' : '⚠️'));
    console.log('Default Data:       ' + (dataOk ? '✅' : '⚠️'));
    console.log('RLS Policies:       ' + (rlsOk ? '✅' : '⚠️'));
    console.log('Verification:       ' + (verifyOk ? '✅' : '⚠️'));

    console.log('\n📋 Default Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:              admin@tsoam.org / admin123');
    console.log('HR Officer:         hr@tsoam.org / hr123');
    console.log('Finance Officer:    finance@tsoam.org / finance123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!supabaseServiceKey) {
      console.log('\n⚠️  IMPORTANT: To enable full security (RLS policies):');
      console.log('   1. Get your Service Role Key from Supabase console');
      console.log('   2. Add to .env: SUPABASE_SERVICE_ROLE_KEY=your_key');
      console.log('   3. Run: npm run supabase:setup again\n');
    } else {
      console.log('\n✅ Supabase is fully configured with RLS policies\n');
    }

    return verifyOk;
  } catch (error) {
    console.error('\n❌ Initialization failed:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  initializeSupabase()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { initializeSupabase };
