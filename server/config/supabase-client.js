const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://ncrecohwtejwygkyoaul.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcmVjb2h3dGVqd3lna3lvYXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNjI2MjcsImV4cCI6MjA3ODczODYyN30.CpBi70Ukc2WNisqMkAYDxJFaCPYFgsf390igeHPJv_M';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client with anon key for client-side
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
});

// Create service role client for admin operations
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : supabase;

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }

    console.log('✅ Supabase connection successful');
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
