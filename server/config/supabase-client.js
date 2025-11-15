require('dotenv').config();

// Placeholder for future Supabase integration
// Currently using local database (MySQL/SQLite)

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Supabase client will be initialized when needed
let supabase = null;
let supabaseAdmin = null;

async function testConnection() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('⚠️  Supabase not configured');
    return false;
  }
  
  try {
    console.log('✅ Supabase credentials available');
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error.message);
    return false;
  }
}

module.exports = {
  supabase,
  supabaseAdmin,
  testConnection,
  supabaseUrl,
  supabaseAnonKey,
};
