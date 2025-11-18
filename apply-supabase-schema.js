/**
 * Supabase Schema Migration Script
 * Applies the complete database schema to Supabase PostgreSQL database
 * 
 * Usage: node apply-supabase-schema.js
 * 
 * This script:
 * - Connects directly to Supabase PostgreSQL database
 * - Reads the complete schema SQL file
 * - Executes all CREATE TABLE and INDEX statements
 * - Reports success/failure for each table
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Parse Supabase URL to get connection details
function parseSupabaseUrl(url) {
  // Supabase URL format: https://[project-ref].supabase.co
  // PostgreSQL URL format: postgresql://[user]:[password]@[host]:[port]/[database]
  
  try {
    const projectRef = url.replace('https://', '').replace('.supabase.co', '');
    const host = `${projectRef}.supabase.co`;
    
    return {
      host,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
      ssl: { rejectUnauthorized: false }
    };
  } catch (error) {
    throw new Error(`Failed to parse Supabase URL: ${error.message}`);
  }
}

async function applySchema() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
    process.exit(1);
  }

  // Get connection config
  const config = parseSupabaseUrl(supabaseUrl);
  config.password = serviceKey;

  console.log('🔄 Connecting to Supabase PostgreSQL...');
  console.log(`   Host: ${config.host}`);
  console.log(`   Database: ${config.database}`);

  const pool = new Pool(config);

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'server/migrations/000_create_complete_schema.sql');
    console.log(`📖 Reading schema from: ${schemaPath}`);
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    let sqlContent = fs.readFileSync(schemaPath, 'utf8');

    // Remove comments and split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comment-only statements
      if (statement.match(/^\/\*[\s\S]*?\*\//)) {
        continue;
      }

      try {
        // Show progress for CREATE TABLE and CREATE INDEX statements
        if (statement.includes('CREATE TABLE') || statement.includes('CREATE INDEX')) {
          const match = statement.match(/CREATE\s+(?:TABLE|INDEX)(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:public\.)?(\w+)/i);
          const name = match ? match[1] : 'Unknown';
          process.stdout.write(`\r⏳ Processing [${i + 1}/${statements.length}] Creating: ${name.padEnd(30)}`);
        }

        await pool.query(statement);
        successCount++;
      } catch (error) {
        errorCount++;
        const errorMsg = `[${i + 1}/${statements.length}] ${error.message}`;
        errors.push(errorMsg);
        
        // Log warning for non-critical errors (like already exists)
        if (!error.message.includes('already exists')) {
          console.error(`\n⚠️  ${errorMsg}`);
        }
      }
    }

    console.log(`\n\n✅ Schema migration completed!`);
    console.log(`   ✓ Successful: ${successCount}`);
    console.log(`   ⚠️  Errors: ${errorCount}`);

    if (errors.length > 0 && errorCount > 0) {
      console.log('\n⚠️  Some errors occurred (usually non-critical):');
      errors.slice(0, 5).forEach(err => console.log(`   - ${err}`));
      if (errors.length > 5) {
        console.log(`   ... and ${errors.length - 5} more errors`);
      }
    }

    // Verify critical tables exist
    console.log('\n🔍 Verifying critical tables...');
    const criticalTables = ['users', 'districts', 'zones', 'homecells', 'members', 'modules'];
    let allTablesExist = true;

    for (const table of criticalTables) {
      const result = await pool.query(
        `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='${table}' AND table_schema='public')`
      );
      const exists = result.rows[0].exists;
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
      if (!exists) allTablesExist = false;
    }

    if (allTablesExist) {
      console.log('\n🎉 All critical tables are present in Supabase!');
      console.log('✨ Database is ready for use');
    } else {
      console.error('\n❌ Some critical tables are missing. Please check the logs above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Failed to apply schema:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify SUPABASE_URL is correct');
    console.error('2. Verify SUPABASE_SERVICE_ROLE_KEY is valid');
    console.error('3. Check that Supabase project is active');
    console.error('4. Try manually executing schema in Supabase SQL Editor');
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the migration
applySchema().catch(error => {
  console.error('💥 Fatal error:', error.message);
  process.exit(1);
});
