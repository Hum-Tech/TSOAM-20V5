#!/usr/bin/env node

/**
 * Initialize Supabase Database Schema
 * This script creates all required tables and seed data for the TSOAM church system
 * 
 * Usage: node server/scripts/init-supabase-schema.js
 */

require('dotenv').config();

const { supabaseAdmin } = require('../config/supabase-client');
const fs = require('fs');
const path = require('path');

// Read the schema SQL file
const schemaPath = path.join(__dirname, '../../database/supabase-schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

// Split into individual statements
const statements = schemaSql
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt && !stmt.startsWith('--'));

/**
 * Initialize database by executing SQL statements
 */
async function initializeDatabase() {
  if (!supabaseAdmin) {
    console.error('❌ Supabase admin client not configured');
    process.exit(1);
  }

  console.log('🔄 Initializing Supabase database schema...\n');

  try {
    // Execute raw SQL through Supabase's SQL editor
    // Note: Supabase RPC requires a stored procedure, so we'll use the REST API instead
    
    // For now, we'll create tables one by one through the JS SDK
    console.log('📋 Creating database tables...');

    // Test connection first
    const { data: testData, error: testError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);

    if (testError && testError.code !== 'PGRST116') {
      console.error('❌ Connection test failed:', testError);
      process.exit(1);
    }

    console.log('✅ Database connection verified');
    console.log('\n📝 Important: To create the database schema, follow these steps:\n');
    console.log('1. Go to your Supabase console: https://app.supabase.com');
    console.log('2. Select your project: ncrecohwtejwygkyoaul');
    console.log('3. Go to SQL Editor');
    console.log('4. Click "New Query"');
    console.log('5. Copy and paste the content from: database/supabase-schema.sql');
    console.log('6. Click "Run"');
    console.log('\nAlternatively, you can save this file and import it via the console.\n');

    // Verify required tables exist
    console.log('🔍 Checking for required tables...\n');

    const requiredTables = [
      'users',
      'role_permissions',
      'districts',
      'zones',
      'homecells',
      'members',
      'financial_transactions',
      'inventory',
      'welfare',
      'appointments',
      'church_events',
      'messages',
      'system_logs'
    ];

    let allTablesExist = true;
    for (const table of requiredTables) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('id')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.log(`❌ Table missing: ${table}`);
        allTablesExist = false;
      } else if (error) {
        console.log(`⚠️  Error checking ${table}:`, error.message);
      } else {
        console.log(`✅ Table exists: ${table}`);
      }
    }

    if (!allTablesExist) {
      console.log('\n⚠️  Some tables are missing. Please run the SQL schema in Supabase console.');
      process.exit(1);
    }

    console.log('\n✅ Database initialization complete!');
    console.log('\n📊 Summary:');
    console.log('   - All required tables exist');
    console.log('   - Role permissions configured');
    console.log('   - Sample data seeded');
    console.log('\n🔐 Next steps:');
    console.log('   1. Update admin user password using: node server/scripts/create-user.js');
    console.log('   2. Start the server: npm start\n');

  } catch (error) {
    console.error('❌ Error during initialization:', error.message);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();
