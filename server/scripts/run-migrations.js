const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('../config/supabase-client');

/**
 * Run SQL migrations from the migrations folder
 */
async function runMigrations() {
  if (!supabaseAdmin) {
    console.error('❌ Supabase admin client not initialized');
    return false;
  }

  try {
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('⚠️  No migration files found');
      return true;
    }

    console.log(`📁 Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`🔄 Applying migration: ${file}`);

      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
          // Try direct execution as fallback
          try {
            await supabaseAdmin.from('_migrations').select('*').limit(0);
          } catch {
            // Table might not exist, try splitting and executing statements
            const statements = sql.split(';').filter(s => s.trim());
            for (const statement of statements) {
              if (statement.trim()) {
                const { error: execError } = await supabaseAdmin.rpc('exec_sql', { 
                  sql_query: statement.trim() + ';' 
                });
                if (execError) {
                  console.warn(`⚠️  Warning in ${file}: ${execError.message}`);
                }
              }
            }
          }
        } else {
          console.log(`✅ Applied: ${file}`);
        }
      } catch (error) {
        console.warn(`⚠️  Error applying ${file}: ${error.message}`);
        // Continue with next migration
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Migration runner error:', error.message);
    return false;
  }
}

module.exports = { runMigrations };
