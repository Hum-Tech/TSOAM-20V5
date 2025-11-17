const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

let createClient;
try {
  ({ createClient } = require('@supabase/supabase-js'));
} catch (error) {
  console.warn('⚠️  Supabase client not available:', error.message);
  createClient = null;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase clients
let supabase = null;
let supabaseAdmin = null;
let isSupabaseConfigured = false;

if (supabaseUrl && supabaseAnonKey && createClient) {
  try {
    // Regular client for user operations
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Admin client for backend operations (uses service role key)
    if (!supabaseServiceKey) {
      console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set - using anonymous key for admin operations');
    }

    supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey
    );

    isSupabaseConfigured = true;
    console.log('✅ Supabase clients initialized successfully');
    console.log('   URL:', supabaseUrl);
    console.log('   Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
    if (supabaseServiceKey) {
      console.log('   Service Role Key: Configured');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Supabase clients:', error.message);
  }
} else {
  console.log('⚠️  Supabase not fully configured');
  console.log('   Required: SUPABASE_URL, SUPABASE_ANON_KEY');
  console.log('   Required for admin operations: SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl) console.log('   Missing: SUPABASE_URL');
  if (!supabaseAnonKey) console.log('   Missing: SUPABASE_ANON_KEY');
  if (!supabaseServiceKey) console.log('   Missing: SUPABASE_SERVICE_ROLE_KEY');
}

// Test connection
async function testConnection() {
  if (!isSupabaseConfigured) {
    console.log('⚠️  Supabase not configured');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist
      console.error('❌ Supabase connection test failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connection verified');
    return true;
  } catch (error) {
    console.error('❌ Connection test error:', error.message);
    return false;
  }
}

// Get user by email
async function getUserByEmail(email) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    console.error('Error fetching user:', error.message);
    return null;
  }
}

// Get user by ID
async function getUserById(id) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    console.error('Error fetching user:', error.message);
    return null;
  }
}

// Create user
async function createUser(userData) {
  if (!supabaseAdmin) return null;

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createUser:', error.message);
    return null;
  }
}

// Update user
async function updateUser(userId, updates) {
  if (!supabaseAdmin) return null;

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateUser:', error.message);
    return null;
  }
}

// Check if table exists
async function tableExists(tableName) {
  if (!supabaseAdmin) return false;

  try {
    const { error } = await supabaseAdmin
      .from(tableName)
      .select('id')
      .limit(1);

    // Table exists if we don't get a "table doesn't exist" error
    return !error || error.code !== 'PGRST116';
  } catch (error) {
    return false;
  }
}

// Initialize database
async function initializeDatabase() {
  if (!isSupabaseConfigured) {
    console.log('⚠️  Supabase not configured');
    return false;
  }

  try {
    console.log('🔄 Checking Supabase database tables...');

    // Check if main tables exist
    const tablesRequired = ['users', 'members', 'employees', 'financial_transactions', 'system_logs'];
    let allTablesExist = true;
    let missingTables = [];

    for (const table of tablesRequired) {
      const exists = await tableExists(table);
      if (!exists) {
        allTablesExist = false;
        missingTables.push(table);
      }
    }

    if (!allTablesExist) {
      console.log(`⚠️  Missing tables: ${missingTables.join(', ')}`);
      console.log('📋 Note: Database tables need to be created.');
      console.log('   Run: npm run supabase:init');
      console.log('   Or manually in Supabase console');
      return false; // Return false - user needs to run setup
    } else {
      console.log('✅ All required tables exist');

      // Verify we can perform basic operations
      const { data: adminUsers, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'admin@tsoam.org')
        .limit(1);

      if (!error && adminUsers && adminUsers.length > 0) {
        console.log('✅ Admin user verified');
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    return false;
  }
}

module.exports = {
  supabase,
  supabaseAdmin,
  isSupabaseConfigured,
  testConnection,
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  tableExists,
  initializeDatabase,
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceKey
};
