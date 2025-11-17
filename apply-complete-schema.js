const fs = require('fs');
const path = require('path');
const { supabaseAdmin, isSupabaseConfigured } = require('./server/config/supabase-client');

const REQUIRED_TABLES = [
  'users',
  'members',
  'employees',
  'financial_transactions',
  'departments',
  'roles',
  'homecells',
  'homecell_members',
  'homecell_leaders',
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

async function checkTableExists(tableName) {
  try {
    const { count, error } = await supabaseAdmin
      .from(tableName)
      .select('id', { count: 'exact', head: true });

    if (error) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

async function runSQLScript() {
  if (!isSupabaseConfigured) {
    console.error('❌ Supabase not configured');
    process.exit(1);
  }

  console.log('📋 Reading SQL setup script...\n');

  const sqlFilePath = path.join(__dirname, 'SUPABASE_COMPLETE_SETUP.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error('❌ SQL file not found:', sqlFilePath);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  // Split by semicolon but preserve comments
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
  console.log('🔄 Executing SQL script...\n');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;

    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.log(`⚠️  Statement ${i + 1}: ${error.message}`);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (err) {
      // RPC might not exist, try alternative approach
      console.log(`⚠️  Cannot execute statement ${i + 1}: ${err.message}`);
    }
  }

  console.log(`\n✅ SQL execution attempt complete`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Errors: ${errorCount}\n`);

  // Verify tables
  console.log('🔍 Verifying tables...\n');
  
  let missingTables = [];
  let foundTables = [];

  for (const tableName of REQUIRED_TABLES) {
    const exists = await checkTableExists(tableName);
    if (exists) {
      console.log(`✅ ${tableName}`);
      foundTables.push(tableName);
    } else {
      console.log(`❌ ${tableName}`);
      missingTables.push(tableName);
    }
  }

  console.log(`\n📊 Summary: ${foundTables.length}/${REQUIRED_TABLES.length} tables verified\n`);

  if (missingTables.length > 0) {
    console.log('⚠️  IMPORTANT: Some tables are still missing!');
    console.log('\n📋 Manual Steps:');
    console.log('1. Go to: https://app.supabase.com');
    console.log('2. Select your project');
    console.log('3. Click "SQL Editor" in the left sidebar');
    console.log('4. Create a new query');
    console.log('5. Copy the entire contents of SUPABASE_COMPLETE_SETUP.sql');
    console.log('6. Paste it into the SQL editor');
    console.log('7. Click "Run" to execute');
    console.log(`\nMissing tables: ${missingTables.join(', ')}`);
    process.exit(1);
  }

  console.log('✅ All required tables are present!');
  console.log('🎯 Your Supabase database is ready!');
}

runSQLScript();
