#!/usr/bin/env node

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('Checking if HomeCells tables exist...\n');

  try {
    const { data, error } = await supabase
      .from('districts')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Districts table error:', error.message);
      console.error('Code:', error.code);
      return false;
    }

    console.log('✅ Districts table exists!');
    console.log('Sample data:', data);
    return true;
  } catch (err) {
    console.error('❌ Exception:', err.message);
    return false;
  }
}

checkTables();
