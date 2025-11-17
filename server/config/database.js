/**
 * Database Configuration Module
 * 
 * This module manages database connections with Supabase as the primary backend.
 * Supabase provides a PostgreSQL database with REST API access.
 * 
 * Configuration:
 * - Supabase is the primary and only production database
 * - No MySQL fallback in production mode
 * - SQLite is disabled as it conflicts with Supabase operation
 */

const path = require("path");
const { supabaseAdmin, isSupabaseConfigured } = require("./supabase-client");
require("dotenv").config({ path: path.join(__dirname, '..', '..', '.env') });

// Force Supabase as the only database backend
const USE_SUPABASE_ONLY = true;
const FORCE_SUPABASE = true;

console.log('📊 Database Configuration:');
console.log('   Mode: Supabase PostgreSQL (Production)');
console.log('   Status:', isSupabaseConfigured ? '✅ Configured' : '❌ Not configured');

// Test database connection
async function testConnection() {
  console.log("🔄 Testing Supabase database connection...");

  if (!FORCE_SUPABASE || !supabaseAdmin) {
    console.error('❌ Supabase is not properly configured');
    console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    return false;
  }

  try {
    // Test Supabase connection by querying users table
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);

    if (!error || (error && error.code === 'PGRST116')) {
      // PGRST116 = table doesn't exist, which is OK - it means connection works
      console.log("✅ Supabase connection verified");
      global.SUPABASE_ENABLED = true;
      return true;
    } else if (error) {
      console.error("❌ Supabase connection test failed:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("⚠️ Supabase connection test error:", err.message);
    return false;
  }
}

// Initialize database - ensure tables exist
async function initializeDatabase() {
  if (!FORCE_SUPABASE || !supabaseAdmin) {
    console.error('❌ Supabase not configured');
    return false;
  }

  console.log("🔄 Initializing Supabase database...");

  try {
    // Check for critical tables
    const criticalTables = ['users', 'members', 'financial_transactions', 'system_logs'];
    let allTablesExist = true;
    const missingTables = [];

    for (const table of criticalTables) {
      try {
        const { error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(0);

        if (error && error.code === 'PGRST116') {
          // Table doesn't exist
          missingTables.push(table);
          allTablesExist = false;
        }
      } catch {
        missingTables.push(table);
        allTablesExist = false;
      }
    }

    if (!allTablesExist) {
      console.warn(`⚠️ Missing tables: ${missingTables.join(', ')}`);
      console.log('📋 DATABASE SETUP REQUIRED:');
      console.log('   1. Go to Supabase Dashboard > SQL Editor');
      console.log('   2. Create a new query');
      console.log('   3. Copy and paste the complete schema from: server/migrations/000_create_complete_schema.sql');
      console.log('   4. Execute the query');
      console.log('   5. Restart your application');
      return false;
    }

    console.log('✅ All critical tables exist');
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    return false;
  }
}

// Direct Supabase query wrapper
// All queries go directly through Supabase REST API, no SQLite fallback
async function query(sql, params = []) {
  if (!FORCE_SUPABASE || !supabaseAdmin) {
    throw new Error('Supabase not properly configured. Cannot execute query.');
  }

  // Note: This function should not be used for raw SQL queries
  // Always use supabaseAdmin client directly in route handlers
  // Example: supabaseAdmin.from('table').select(...).eq(...)
  throw new Error(
    'Raw SQL queries are not supported. Use Supabase client API directly in route handlers.\n' +
    'Example: supabaseAdmin.from("table").select("*")' 
  );
}

// Get Supabase client (for direct use in routes)
function getSupabaseClient() {
  if (!supabaseAdmin) {
    throw new Error('Supabase client not initialized');
  }
  return supabaseAdmin;
}

// Close connections (Supabase doesn't require explicit connection closure)
async function closePool() {
  console.log("✅ Supabase client closed");
}

module.exports = {
  testConnection,
  initializeDatabase,
  query,
  getSupabaseClient,
  closePool,
  USE_SUPABASE_ONLY,
  FORCE_SUPABASE,
  supabaseAdmin
};
